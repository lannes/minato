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

CentOS 7
sudo systemctl start nginx
CentOS 6
chkconfig nginx on

sudo firewall-cmd --permanent --zone=public --add-service=http 
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --reload
```
```sh
sudo service nginx stop 
sudo service nginx start   
sudo service nginx restart
sudo /etc/init.d/nginx reload
```
* Test config
```sh
sudo nginx -t
```
## **5. OPEN PORT 80**
```
iptables -I INPUT 2 -m state --state NEW -m tcp -p tcp --dport 80 -j ACCEPT
service iptables save
service iptables restart
```
## **6. RUN APP**
* Setup files
    * client: /home/minato/client
    * server: /home/minato/server

* Run app
```sh
pm2 start ./bin/app.js -i max --name=blockchain

pm2 start ./bin/app.js -i max --node-args="--nouse-idle-notification --expose-gc -–max-old-space-size=2048 --max-new-space-size=2048"  
```
* Config
```sh
/etc/nginx/nginx.conf
```
```nginx
http {
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    upstream blockchain {
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
            proxy_pass http://blockchain;
            #HTTP version 1.1 is needed for sockets
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
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
## **7. SETUP SSL**
* GoDaddy

* Let’s Encrypt
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
* OPEN PORT 443
```sh
sudo iptables -I INPUT -p tcp -m tcp --dport 443 -j ACCEPT
```
* NGINX
```nginx
    #To redirect all HTTP traffic(keeping requests like POST intact)
    #to HTTPS
    server {
        listen 80;
        server_name localhost;
    
        location / {
            return 307 http://minato.zone$request_uri;
        }
    }

    #The actual HTTPS server
    server {
        listen 443 ssl http2;
        server_name  minato.zone; 

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
