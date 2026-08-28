import urllib.request
import urllib.parse
import json

def search(tag):
    url = f"https://musicbrainz.org/ws/2/artist?query=tag:{urllib.parse.quote(tag)}&fmt=json"
    print("URL:", url)
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode('utf-8'))
        names = [a.get('name') for a in data.get('artists', [])]
        print(names)
    except Exception as e:
        print(e)

search('acid-jazz')
search('"acid jazz"')
search('acid jazz')
search('"acid-jazz"')
