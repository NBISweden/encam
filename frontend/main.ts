const db = require('./db.json')

console.log(db)

document.body.innerHTML = `<pre>${JSON.stringify(db, 2, 2)}</pre>`

declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

