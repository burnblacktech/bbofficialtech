
const bcrypt = require('bcryptjs');
const hash = '$2a$12$Fz7xlkSbLTYL4sYw2oGvweEoC/1BQ6ps9wWzGoEWLiF2x3.4PynOG';
const pass = 'user123';
bcrypt.compare(pass, hash).then(res => console.log('Match:', res)).catch(e => console.error(e));
