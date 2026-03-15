import {io} from 'socket.io-client'

const socket = io("https://192.168.1.1:3000")


socket.on('connetc',()=>{
   console.log("socket is connected")
   setInterval(()=>{
     socket.emit('agent-data',{
        
     });
    },5000)
})