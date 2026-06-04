"""Quick server startup with endpoint checks"""
import os, sys, time, threading, uvicorn, urllib.request, json, logging
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, '.')
logging.disable(logging.CRITICAL)

config = uvicorn.Config('app.main:app', host='127.0.0.1', port=8000, log_level='error')
server = uvicorn.Server(config)
t = threading.Thread(target=server.run)
t.daemon = True
t.start()
time.sleep(6)

BASE = 'http://127.0.0.1:8000'
ok = 0
fail = 0

def check(name, method, path, data=None, expect=(200,)):
    global ok, fail
    try:
        req = urllib.request.Request(f'{BASE}{path}', data=json.dumps(data).encode() if data else None, headers={'Content-Type':'application/json'} if data else {})
        r = urllib.request.urlopen(req, timeout=10)
        code = r.status
    except urllib.error.HTTPError as e:
        code = e.code
    except Exception as e:
        code = -1
    ok_or = code in expect or (isinstance(expect, tuple) and code in expect)
    label = 'PASS' if ok_or else 'FAIL'
    if ok_or: ok += 1
    else: fail += 1
    print(f'  [{label}] {name:35s} {code}')
    return code

# Public
print('\n--- Backend Starting ---')
check('Health', 'GET', '/health')

# Signed endpoints
code = check('Signup', 'POST', '/auth/signup', {'email':'test@demo.com','password':'Test12345!','name':'Test User'}, expect=(200,400))

code, body = 401, ''
try:
    req = urllib.request.Request(f'{BASE}/auth/login', data=json.dumps({'email':'test@demo.com','password':'Test12345!'}).encode(), headers={'Content-Type':'application/json'})
    r = urllib.request.urlopen(req, timeout=10)
    code, body = r.status, r.read().decode()
except urllib.error.HTTPError as e:
    code, body = e.code, e.read().decode()

token = ''
if code == 200:
    token = json.loads(body).get('access_token', '')
else:
    try:
        req = urllib.request.Request(f'{BASE}/auth/login', data=json.dumps({'email':'demo@test.com','password':'Demo12345!'}).encode(), headers={'Content-Type':'application/json'})
        r = urllib.request.urlopen(req, timeout=10)
        token = json.loads(r.read()).get('access_token', '')
    except:
        pass

HEADERS = {'Authorization': f'Bearer {token}'} if token else {}
print(f'  Login: {code} token={bool(token)}')

if token:
    check('Flashcards', 'GET', '/flashcards/', headers=HEADERS)
    check('Flashcards create', 'POST', '/flashcards/', {'question':'Sample?','answer':'Sample!','difficulty':'easy'}, headers=HEADERS)
    check('Due cards', 'GET', '/flashcards/due?limit=5', headers=HEADERS)
    check('Notes', 'GET', '/notes/', headers=HEADERS)
    check('Notes create', 'POST', '/notes/', {'title':'Test','content':'Hello','tags':['test']}, headers=HEADERS)
    check('Quiz list', 'GET', '/quiz/', headers=HEADERS)
    check('Quiz create', 'POST', '/quiz/create', {'title':'General Knowledge','count':5}, headers=HEADERS)
    check('Knowledge graph', 'GET', '/knowledge/graph', headers=HEADERS)
    check('Learning path', 'GET', '/knowledge/path/next', headers=HEADERS)
    check('AI define', 'POST', '/api/ai/define', {'term':'mitosis'}, headers=HEADERS)
    check('AI grade', 'POST', '/api/ai/grade', {'question':'2+2?','reference':'4','user_answer':'4'}, headers=HEADERS)
    check('Files list', 'GET', '/files/', headers=HEADERS)
    check('Search', 'GET', '/search/', headers=HEADERS)

print(f'\n  {ok}/{ok+fail} endpoints OK')
print(f'\n  Backend at http://127.0.0.1:8000')
print('  Keep this terminal open.')
print('  Frontend: cd to project root and run: npm run dev\n')

try:
    while True: time.sleep(30)
except KeyboardInterrupt:
    pass
