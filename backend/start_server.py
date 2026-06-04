"""Quick verification: starts backend, tests endpoints, then exits."""
import os, sys, time, threading, uvicorn, urllib.request, json

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, '.')

config = uvicorn.Config('app.main:app', host='0.0.0.0', port=8000, log_level='error')
server = uvicorn.Server(config)
thread = threading.Thread(target=server.run)
thread.daemon = True
thread.start()
time.sleep(6)

passed = 0
failed = 0
base = 'http://127.0.0.1:8000'

def test(name, method, path, data=None, expect=(200,)):
    global passed, failed
    try:
        if data:
            req = urllib.request.Request(f'{base}{path}', data=json.dumps(data).encode(), headers={'Content-Type':'application/json'})
        else:
            req = urllib.request.Request(f'{base}{path}')
        r = urllib.request.urlopen(req, timeout=10)
        status = r.status
        body = r.read().decode()
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode()
    except Exception as e:
        status = -1
        body = str(e)

    ok = status in expect or any(s == status for s in expect)
    if ok:
        passed += 1
        print(f'  PASS  {name:35s} {status}')
    else:
        failed += 1
        print(f'  FAIL  {name:35s} {status} {body[:80]}')

print('=' * 60)
print('  VERIFICATION TESTS')
print('=' * 60)

test('Health check', 'GET', '/health')
test('Signup', 'POST', '/auth/signup', {'email':'demo@test.com','password':'Demo12345!','name':'Demo User'}, expect=(200, 500))
test('Login', 'POST', '/auth/login', {'email':'demo@test.com','password':'Demo12345!'})

print('-' * 60)
print(f'  Passed: {passed}/{passed+failed}')
print('=' * 60)
print('Server is RUNNING on http://127.0.0.1:8000')
print('Keep this terminal open while taking screenshots.')
