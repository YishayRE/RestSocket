const {Socket} = require('socket.io');

const { comprobarJWT } = require('../helpers');
const {ChatMensajes} = require('../models');

const chatMensajes = new ChatMensajes();

const socketController = async( socket = new Socket(), io ) => {
	const usuario = await comprobarJWT(socket.handshake.headers['x-token']);

	if(!usuario){
		return socket.disconnect();
	}

	console.log('Se conectó', usuario.nombre);

	chatMensajes.conectarUsuario(usuario);
	io.emit('usuarios-activos', chatMensajes.usuariosArr);
	socket.emit('recibir-mensajes', chatMensajes.ultimos10);

	socket.join(usuario.id);

	socket.on('disconnect', () => {
		chatMensajes.desconectarUsuario(usuario.id);
		io.emit('usuarios-activos', chatMensajes.usuariosArr);
	});

	socket.on('enviar-mensaje', ({mensaje, uid}) => {
		if(uid){
			chatMensajes.enviarMensaje(usuario.id, usuario.nombre, mensaje);
			socket.to(uid).emit('mensaje-privado', chatMensajes.ultimos10);
		}
		else{
			chatMensajes.enviarMensaje(usuario.id, usuario.nombre, mensaje);
			io.emit('recibir-mensajes', chatMensajes.ultimos10);
		}
	});
}

module.exports = {
	socketController
}