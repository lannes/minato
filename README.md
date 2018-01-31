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

sudo firewall-cmd --permanent --zone=public --add-service=http 
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --reload
```
## **5. RUN APP**
* Setup files
    * client: /home/minato/client
    * server: /home/minato/server

* Run app
```sh
pm2 start ./bin/app.js -i max --name=blockchain
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

    upstream webpush {
        server 127.0.0.1:3000;
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

        location /api {
            proxy_pass http://webpush;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }

        location /minato {
            proxy_pass http://blockchain;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }

        error_page 404 /404.html;
        location = /40x.html {
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
        }
    }
}
```
* Restart nginx
```sh
sudo service nginx restart
```
