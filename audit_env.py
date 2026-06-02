import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('76.13.248.249', username='root', password="PD-B'fr,L@mw9bon;cU1",
            timeout=10, look_for_keys=False, allow_agent=False)
_, o, _ = ssh.exec_command('cat /home/ray/father-agent/.env 2>&1', timeout=10)
print(o.read().decode('utf-8', errors='replace'))
ssh.close()
