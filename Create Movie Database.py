from bs4 import BeautifulSoup
import requests
import pandas as pd
from pymongo import MongoClient

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
uri = "mongodb+srv://llamassi86:dO0ARLvtSPLtDleY@cluster0.nalmr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
    
# Define database and collection
db = client["movie_database"]
collection = db["movies"]


BASE_BO_URL = "https://www.boxofficemojo.com/chart/top_lifetime_gross/?area=XWW"
headers = {
    "User-Agent": "Mozilla/5.0"
}

movie_titles = []

for offset in range(0, 800, 200):
    url = f"{BASE_BO_URL}?area=XWW&offset={offset}"
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to fetch page {offset}")
        continue
    
    soup = BeautifulSoup(response.text, "html.parser")

# Get the table rows (skip the header)
    table = soup.find("table")
    rows = table.find_all("tr")[1:]

# Extract movie titles

    for row in rows:
        cols = row.find_all("td")
        if len(cols) >= 2:
            title = cols[1].text.strip()
            movie_titles.append(title)


print(movie_titles[:10])

api_key = "b5e81547"

BASE_URL = "http://www.omdbapi.com/"

movie_data = []
for title in (movie_titles[:999]):
    params = {
        "t": title,
        "apikey": api_key
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()

    if data["Response"] == "True":
        movie_info = {
            "Title": data.get("Title"),
            "Year": data.get("Year"),
            "Genre": data.get("Genre"),
            "Director": data.get("Director"),
            "Actors": data.get("Actors"),
            "Imdb_rating":data.get("imdbRating"),
            "Poster_url": data.get("Poster", None),
            "Imdb_link": f"https://www.imdb.com/title/{data.get('imdbID')}/" if data.get("imdbID") else None
            }
        movie_data.append(movie_info)
        collection.insert_one(movie_info)
            
    else:
        pass
        
print(f"Inserted {len(movie_data)} movies into MongoDB.")

df = pd.DataFrame(movie_data)

df.to_csv("movie_data.csv", index=False)

print("Movie data saved successfully!")



