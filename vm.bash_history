touch .bashrc
echo '. .bashrc' > .profile
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
netcat -l -p 1234 > /etc/wireguard/wg0.conf
systemctl enable wg-quick@wg0.service
reboot
nvm list-remote
nvm i 21
git clone https://github.com/nikelborm/fetch_timeout_poc.git
cd fetch_timeout_poc/
npm start
