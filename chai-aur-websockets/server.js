import http from "node:http";
import{WebSocketServer} from "ws";
import fs from "node:fs/promises";
import path from "path";



const port= process.env.PORT || 3000;

const httpServer = http.createServer(async (req, res) => {
    const indexFile=  await fs.readFile(path.resolve("./index.html"), "utf-8");  //path.resolve se humne index.html ka absolute path le liya hai aur usko utf-8 encoding me read kar liya hai
   res.setHeader("Content-Type", "text/html");  
    return res.end(indexFile);  //indexFile me jo content hai usko response me bhej diya hai

    // .end method se humne response ko end kar diya hai aur usme indexFile ka content bhej diya hai, to jab client is server ko access karega to usko index.html ka content milega
});

// agar client normal http req send karega toh uske liye ue uper ka code usko handle karega 


//agar websocket req send kare >> toh then this foloowing code will handle it 

const wsServer= new WebSocketServer({server: httpServer});

wsServer.on("connection", (websocket) => {
    console.log("client connected");    

    // Kuch message aane par iss ws connection pe ye callback chalega
    websocket.on("message", (data) => {
        console.log(`message received from client: ${data}`);  
        // websocket.send("hello ji form server");  // ye message client ko bhej diya hai ki message receive ho gaya hai
        // websocket.send(data.toString());  // ye message client ko bhej diya hai ki message receive ho gaya hai aur usme client ka message bhi include kar diya hai
        // here we are sending the same message back to the client that we received from the client, this is called echoing the message back to the client.
        //abhi suppose mutilpe log hoge connected to a single chat room 

        // broadcasting the message to all the clients that are connected to the server, to do that we can use the wsServer.clients property which gives us a set of all the clients that are connected to the server, then we can loop through that set and send the message to each client.

        wsServer.clients.forEach((client) => {
            if(client.readyState === 1){  // readyState 1 ka matlab hai ki client connection open hai, to hum usko message bhej sakte hain
                client.send(data.toString());  // ye message client ko bhej diya hai ki message receive ho gaya hai aur usme client ka message bhi include kar diya hai
            }   
    });

});


});
    


httpServer.listen(port,()=>{
    console.log(`server running on port ${port}`);
});

    