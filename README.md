**CENTOS 7**

## **1. PORT SSH**
```sh
change port ssh
vi /etc/ssh/sshd_config
Add the following code to either the top or the bottom of the configuration file.

# SSH Port
Port 2124  # the port you want to change it to

firewall-cmd --add-port 2124/tcp --permanent
firewall-cmd --add-port 2124/tcp

service sshd restart
```
## **2. INSTALL NODEJS**
```sh
curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -

sudo yum -y install nodejs
sudo yum install gcc-c++ make
```
## **3. INSTALL PM2**
```sh
npm install pm2@latest -g
```
## **4. INSTALL NGINX**
```sh
sudo yum install epel-release

sudo yum install nginx

sudo systemctl start nginx
sudo systemctl restart nginx
sudo systemctl reload nginx

sudo firewall-cmd --permanent --zone=public --add-service=http 
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --reload
```
* Test config
```sh
sudo nginx -t
```
## **5. RUN APP**
* Source code
```
+ client
|   + base
|   + browser
|   + nodejs
|   + index.html
|   + package.json
+ server
|   + signal (for webrtc)
|   + web (for test browser at localhost, need compile from typescript to js)
|   + package.json
|   + tsconfig.json (typescript config)
```    
* Setup files on server
```
+ /home/minato/client
|   + base
|   + browser
|   + nodejs
|   + index.html
|   + package.json
+ /home/minato/server
|   + signal
|   + package.json
```
* signalserver (port 3002)
```sh
cd /home/minato/server
npm install
pm2 start ./signal/app.js --name signalserver
```
* nodejs client
```sh
cd /home/minato/client
npm install
pm2 start ./nodejs/app.js --name blockchain
```
* browser client
```sh
sudo vi /etc/nginx/nginx.conf
```
```nginx
http {
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    upstream signalserver {
        server 127.0.0.1:3002;
    }

    server {
        listen       80;
        root         /home/minato/client;
        index        index.html;

        location / {
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }

        location /minato {
            proxy_pass http://signalserver;
            #HTTP version 1.1 is needed for sockets
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }

        location /nodejs {
            deny all;
            return 404;
        }

        error_page 404 /404.html;
        location = /usr/share/nginx/html/40x.html {
        }

        error_page 500 502 503 504 /50x.html;
        location = /usr/share/nginx/html/50x.html {
        }
    }
}
```
## **6. SETUP SSL**
* GoDaddy
    * Domains\My Domains\minato.zone\DNS Management
    * Records
        |Type  |Name  |Value    |TLS    |
        |------|:----:|:-------:|-------|
        |A     |@     |x.x.x.x  |1 Hour |

* Let’s Encrypt
https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-centos-7
```sh
export LC_ALL=C

cd /usr/bin
wget https://dl.eff.org/certbot-auto
chmod a+x certbot-auto
ln -s /usr/bin/certbot-auto /usr/bin/certbot

certbot certonly -a webroot --webroot-path=/home/minato/client -d minato.zone -d www.minato.zone

IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/minato.zone/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/minato.zone/privkey.pem
   Your cert will expire on 2018-05-07. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
```
* CERT RENEW
```sh
sudo crontab -e
01 1 * * 0 /usr/bin/certbot renew >> /var/log/ssl-renew.log 
06 1 * * 0 /usr/bin/systemctl nginx reload
```
* NGINX
```nginx
    #To redirect all HTTP traffic(keeping requests like POST intact)
    #to HTTPS
    server {
        listen 80;
        server_name localhost;
    
        location / {
            return 307 https://minato.zone$request_uri;
        }
    }

    #The actual HTTPS server
    server {
        listen 443 ssl http2;
        server_name minato.zone; 

        ssl_certificate /etc/letsencrypt/live/minato.zone/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/minato.zone/privkey.pem;

        # SSL Configuration Start
        ssl_stapling on;
        ssl_stapling_verify on;
        resolver 8.8.4.4 8.8.8.8 valid=300s;
        resolver_timeout 10s;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_prefer_server_ciphers On;
        ssl_ciphers ECDH+AESGCM:DH+AESGCM:ECDH+AES256:DH+AES256:ECDH+AES128:DH+AES:ECDH+3DES:DH+3DES:RSA+AESGCM:RSA+AES:RSA+3DES:!aNULL:!MD5:!DSS;
    
        # Closing SSL configuration

        location ~ /.well-known {
        	allow all;
	    }
        ...
    }
```
## **7. WEBRTC**

## **8. TURN SERVER**
```sh
yum install -y make gcc cc gcc-c++ wget
yum install -y openssl-devel libevent libevent-devel mysql-devel mysql-server

wget https://github.com/downloads/libevent/libevent/libevent-2.0.21-stable.tar.gz
tar xvfz libevent-2.0.21-stable.tar.gz
cd libevent-2.0.21-stable && ./configure
make && make install && cd ..

wget http://turnserver.open-sys.org/downloads/v3.2.4.1/turnserver-3.2.4.1.tar.gz
tar -xvzf turnserver-3.2.4.1.tar.gz
cd turnserver-3.2.4.1
./configure
make
make install

cd /etc
mkdir turnserver && cd turnserver
vi turnserver.conf

user=minato:hakoge4
listening-port=19302
listening-ip=

/etc/turnuserdb.conf

$ turnserver [-n | -c <config-file> ] [flags] [ --userdb=<userdb-file> | --psql-userdb=<db-conn-string> | --mysql-userdb=<db-conn-string>  | --mongo-userdb=<db-conn-string>  | --redis-userdb=<db-conn-string> ] [-z | --no-auth | -a | --lt-cred-mech ] [options]

turnserver -v -r ip:19302 -a -b turnuserdb.conf -c turnserver.conf -u minato -r ip:19302 -p hokage4
```