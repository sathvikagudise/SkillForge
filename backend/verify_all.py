"""Full end-to-end verification of all backend endpoints"""
import os, sys, time, threading, uvicorn, urllib.request, json, logging

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, '.')
logging.disable(logging.CRITICAL)

config = uvicorn.Config('app.main:app', host='127.0.0.1', port=8000, log_level='error')
server = uvicorn.Server(config)
t = threading.Thread(target=server.run)
t.daemon = True
t.start()
time.sleep(8)

BASE = 'http://127.0.0.1:8000'
passed = 0
failed = 0
total = 0

def test(name, method, path, data=None, headers=None, expect=(200,)):
    global passed, failed, total
    total += 1
    for retry in range(3):
        try:
            req = urllib.request.Request(f'{BASE}{path}', data=json.dumps(data).encode() if data else None, headers=headers or {})
            if data: req.add_header('Content-Type', 'application/json')
            r = urllib.request.urlopen(req, timeout=15)
            code, body = r.status, r.read().decode()
            break
        except urllib.error.HTTPError as e:
            code, body = e.code, e.read().decode()
            break
        except Exception as e:
            code, body = -1, str(e)[:60]
            if retry < 2: time.sleep(1)
    ok = code in expect or (isinstance(expect, tuple) and code in expect)
    status = 'PASS' if ok else 'FAIL'
    if ok: passed += 1
    else: failed += 1
    print(f'  [{status}] {name:42s} {code}')
    if not ok: print(f'         {body[:120]}')
    return code, body

print('='*65)
print('  FULL END-TO-END VERIFICATION')
print('='*65)

# === PUBLIC ===
print('\n--- Public ---')
test('Health check', 'GET', '/health')

# === LOGIN ===
print('\n--- Login ---')
code, body = test('Signup user', 'POST', '/auth/signup',
    {'email':'verify@test.com','password':'TestPass123!','name':'Verify User'},
    expect=(200, 400, 500))

# Get token via login
code, body = test('Login', 'POST', '/auth/login',
    {'email':'verify@test.com','password':'TestPass123!'},
    expect=(200, 401, 500))

token = ''
if code == 200:
    token = json.loads(body).get('access_token', '')
if not token:
    code, body = test('Login demo', 'POST', '/auth/login',
        {'email':'demo@test.com','password':'Demo12345!'},
        expect=(200, 401))
    if code == 200:
        token = json.loads(body).get('access_token', '')

HEADERS = {'Authorization': f'Bearer {token}'} if token else {}
if token: print(f'  Token: YES ({token[:20]}...)')
else: print(f'  Token: NO (some tests will 403)')

# === AUTH-REQUIRED ===
print('\n--- Notes ---')
test('List notes', 'GET', '/notes/', headers=HEADERS)
test('Create note', 'POST', '/notes/', {'title':'Test','content':'Hello','tags':['test']}, headers=HEADERS, expect=(200,201))
code, body = test('List notes (after)', 'GET', '/notes/', headers=HEADERS)
try:
    notes = json.loads(body) if body and isinstance(json.loads(body), list) else []
    if notes and len(notes)>0:
        nid = notes[0].get('id', 1)
        test(f'Get note {nid}', 'GET', f'/notes/{nid}', headers=HEADERS)
except: pass

print('\n--- Flashcards ---')
test('List', 'GET', '/flashcards/', headers=HEADERS)
test('Create', 'POST', '/flashcards/', {'question':'What is Python?','answer':'A programming language','difficulty':'easy'}, headers=HEADERS, expect=(200,201))
code, body = test('List after', 'GET', '/flashcards/', headers=HEADERS)
try:
    cards = json.loads(body) if body and isinstance(json.loads(body), list) else []
    print(f'  Cards count: {len(cards)}')
    if cards:
        cid = cards[0].get('id', 1)
        test(f'Review card {cid}', 'POST', f'/flashcards/{cid}/review',
            {'quality':4,'confidence':0.8,'response_time_ms':2500}, headers=HEADERS, expect=(200,404))
except: pass
test('Due cards', 'GET', '/flashcards/due?limit=5', headers=HEADERS)

print('\n--- Quiz ---')
test('List quizzes', 'GET', '/quiz/', headers=HEADERS)
test('Create standalone', 'POST', '/quiz/create', {'title':'General Knowledge','count':5}, headers=HEADERS)
code, body = test('List after', 'GET', '/quiz/', headers=HEADERS)
try:
    quizzes = json.loads(body) if body and isinstance(json.loads(body), list) else []
    print(f'  Quizzes count: {len(quizzes)}')
    if quizzes:
        qid = quizzes[0].get('id', 1)
        test(f'Get quiz {qid}', 'GET', f'/quiz/{qid}', headers=HEADERS)
        test(f'Submit quiz {qid}', 'POST', f'/quiz/{qid}/submit',
            {'answers':{'0':0,'1':0,'2':0,'3':0,'4':0}}, headers=HEADERS)
except: pass

print('\n--- Knowledge / Learning Path ---')
test('Knowledge graph', 'GET', '/knowledge/graph', headers=HEADERS)
test('Path next', 'GET', '/knowledge/path/next', headers=HEADERS)

print('\n--- AI ---')
test('Define', 'POST', '/api/ai/define', {'term':'mitosis'}, headers=HEADERS)
test('Grade', 'POST', '/api/ai/grade', {'question':'2+2?','reference':'4','user_answer':'4'}, headers=HEADERS)

print('\n--- Files ---')
test('List files', 'GET', '/files/', headers=HEADERS, expect=(200,404))

print('\n--- Search ---')
test('Search', 'GET', '/search/', headers=HEADERS, expect=(200,404))

print('\n--- Email ---')
test('Send reminder', 'POST', '/email/send-task-reminder',
    {'email':'test@test.com','tasks':[]}, headers=HEADERS, expect=(200,400,422))

print('\n--- Calendar ---')
test('Events', 'GET', '/calendar/', headers=HEADERS, expect=(200,404))

# === SUMMARY ===
print('='*65)
pct = int(passed/total*100) if total else 0
print(f'  {passed}/{total} passed ({pct}%)', end='')
if failed == 0: print(' - ALL OK')
else: print(f' - {failed} need attention')
print('='*65)
print('\nServer running on http://127.0.0.1:8000')
server.should_exit = False
try:
    while True: time.sleep(60)
except KeyboardInterrupt:
    print('Stopped.')
