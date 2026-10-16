// Datos de prueba para desarrollar el front sin back-end. Son los mismos ejemplos de los wireframes.

export const usuarios = [
    {
        id: 1,
        nombre: 'Usuario de prueba',
        email: 'demo@autocar.test',
        contrasena: 'demo1234',
        localidad: 'Mercedes, Buenos Aires',
        rol: 'usuario',
        plan: { tipo: 'Ambas', nivel: 'Oro' },
    },
];

export const publicaciones = [
    { id: 1, marca: 'Toyota', modelo: 'Corolla', anio: 2018, km: 85000, precio: 8500000, localidad: 'Mercedes, BA', aceptaCanje: true },
    { id: 2, marca: 'Ford', modelo: 'Ranger', anio: 2020, km: 64000, precio: 9200000, localidad: 'Luján, BA', aceptaCanje: true },
    { id: 3, marca: 'Volkswagen', modelo: 'Gol', anio: 2016, km: 120300, precio: 5600000, localidad: 'Chivilcoy, BA', aceptaCanje: false },
    { id: 4, marca: 'Chevrolet', modelo: 'Onix', anio: 2019, km: 62300, precio: 4800000, localidad: 'Mercedes, BA', aceptaCanje: true },
    { id: 5, marca: 'Fiat', modelo: 'Cronos', anio: 2021, km: 38000, precio: 11900000, localidad: 'Luján, BA', aceptaCanje: false },
    { id: 6, marca: 'Renault', modelo: 'Sandero', anio: 2017, km: 97000, precio: 6200000, localidad: 'Mercedes, BA', aceptaCanje: true },
];
