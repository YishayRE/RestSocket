let usuario = null;
let socket = null;

const txtUid = document.querySelector('#txtUid');
const txtMens = document.querySelector('#txtMens');
const ulUsuarios = document.querySelector('#ulUsuarios');
const ulMensajes = document.querySelector('#ulMensajes');
const btnSalir = document.querySelector('#btnSalir');

const url = ( window.location.hostname.includes('localhost') )
    ? 'http://localhost:8080/api/auth/'
    : 'https://restserver-simple.herokuapp.com/api/auth/';

const validarJWT = async() => {
	const token = localStorage.getItem('token') || '';

	if(token.length <= 10){
		window.location = 'index.html';
		throw new Error('No hay token en el servidor');
	}

	const resp = await fetch(url, {
		headers: {'x-token': token}
	});

	const {usuario: userDB, token: tokenDB} = await resp.json();
	localStorage.setItem('token', tokenDB);
	usuario = userDB;
	document.title = usuario.nombre;

	await conectarSocket();
}

const conectarSocket = async() => {
	socket = io({
		'extraHeaders': {
			'x-token': localStorage.getItem('token')
		}
	});

	socket.on('connect', () => {
		console.log('Sockets online');
	});

	socket.on('disconnect', () => {
		console.log('Socket offline');
	});

	socket.on('recibir-mensajes', dibujarMensajes);

	socket.on('usuarios-activos', (payload) => {
		dibujarUsuarios(payload);
	});

	socket.on('mensaje-privado', dibujarMensajes);
}

const dibujarUsuarios = (usuarios = []) => {
	let usersHtml = '';
	usuarios.forEach(({nombre, uid}) => {
		usersHtml+= `
			<li>
				<p>
					<h5 class="text-success">
						${nombre}
					</h5>
					<span class="fs-6 text-muted">
						${uid}
					</span>
				</p>
			</li>
		`;
	});

	ulUsuarios.innerHTML = usersHtml;
}

const dibujarMensajes = (mensajes = []) => {
	let mensajesHtml = '';
	mensajes.forEach(({nombre, mensaje}) => {
		mensajesHtml += `
			<li>
				<p>
					<span class="text-primary">
						${nombre}
					</span>
					<span>
						${mensaje}
					</span>
				</p>
			</li>
		`;
	});

	ulMensajes.innerHTML = mensajesHtml;
}

//el parametro ev retorna el numero de evento
//de cada tecla, buscar cada evento puede servir
txtMens.addEventListener('keyup', ({keyCode}) => {
	const mensaje = txtMens.value;
	const uid = txtUid.value;

	if(keyCode !== 13){
		return;
	}
	if(mensaje.length === 0){
		return;
	}

	socket.emit('enviar-mensaje', {mensaje, uid});

	txtMens.value = '';
});

const main = async() => {
	await validarJWT();
}

main();