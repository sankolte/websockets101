Let's separate the server side and browser side.

Server side

You wrote:

const httpServer = http.createServer(...);

const wsServer = new WebSocketServer({
    server: httpServer
});

This means:

"Use the same HTTP server to handle WebSocket upgrade requests."

So your Node server is listening on one port, say 3000.

Browser side

In your HTML:

const { port } = window.location;

const connection = new WebSocket(`ws://localhost:${port}`);

Suppose you opened:

http://localhost:3000

Then:

window.location.port

is:

"3000"

So the browser creates:

new WebSocket("ws://localhost:3000")

and tries to connect to the same server.

Why do we need the URL again?

Because the browser doesn't magically know which WebSocket server to connect to.

When you write:

new WebSocket(...)

you're telling the browser:

"Open a WebSocket connection to this address."

Just like:

fetch("http://localhost:3000/api")

needs a URL, WebSocket needs one too.

What happens internally?
Step 1

Browser requests page:

GET /

to

http://localhost:3000

Your HTTP server returns:

index.html
Step 2

JavaScript runs:

new WebSocket("ws://localhost:3000")

Browser sends:

GET / HTTP/1.1
Upgrade: websocket
Connection: Upgrade

This is a special HTTP request asking:

"Can we upgrade this connection to WebSocket?"

Step 3

Because you attached WebSocketServer to the HTTP server:

new WebSocketServer({
    server: httpServer
});

the ws library catches that upgrade request and converts it into a WebSocket connection.

Then:

wsServer.on("connection", (ws) => {
    console.log("client connected");
});

runs.