const toLowerCase = (char) => `-${char.toLowerCase()}`;
const toSnakeCase = (value) => value.replace(/[A-Z]/g, toLowerCase);

export default new Proxy(
    {},
    {
        get: (target, property) => document.getElementById(toSnakeCase(property)),
    },
);