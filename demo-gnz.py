# Helper to read local files
import os
import langchain

# Vector Support
from langchain.vectorstores import FAISS
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Model and chain
from langchain.chat_models import ChatOpenAI

# The LangChain component we'll use to get the documents
from langchain.chains import RetrievalQA

# Text splitters
from langchain.text_splitter import CharacterTextSplitter
from langchain.document_loaders import TextLoader

langchain.debug = True

openai_api_key="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"
llm = ChatOpenAI(model_name='gpt-4', openai_api_key=openai_api_key, verbose=True)

embeddings = OpenAIEmbeddings(disallowed_special=(), openai_api_key=openai_api_key)

root_dir = 'data-gnz'
docs = []

# Go through each folder
for dirpath, dirnames, filenames in os.walk(root_dir):

    # Go through each file
    for file in filenames:
        try:
            # Load up the file as a doc and split
            loader = TextLoader(os.path.join(dirpath, file), encoding='utf-8')
            docs.extend(loader.load_and_split())
        except Exception as e:
            pass

print (f"You have {len(docs)} documents\n")
print ("------ Start Document ------")
print (docs[0].page_content[:300])

# Get your text splitter ready
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)

# Split your documents into texts
texts = text_splitter.split_documents(docs)

# Turn your texts into embeddings
embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)

docsearch = FAISS.from_documents(texts, embeddings)

# Get our retriever ready
qa = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=docsearch.as_retriever(), verbose=True)

classInfo = "newsletter functionality"
dbOrm = "mongoose"
functionsList = "addEmail, deleteEmail, sendEmail, sendEmailToList"

# query = "Write me a class that implements a shopping list functionality. Use prisma orm to connect to the database. The class should have the following methods implemented: addItem, getItems, removeItem, updateItem. Show me only the source code. Do not include anything else."
query = f"Write me a backend class that implements a {classInfo}. Use {dbOrm} orm to connect to the database. Use any npmjs package you need. The class should have the following methods implemented: {functionsList}. Show me only the source code. Do not include anything else."
output = qa.run(query)

print (output)
