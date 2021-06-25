const electron = require('electron')
const url = require('url')
const path = require('path')
const app = electron.app || electron.remote.app
const Store = require('nedb')
const {BrowserWindow, Menu, ipcMain} = electron

//from util.js
const { menuShift, devTools } = require('./src/utils')
//from models.js
const { Sale, Item, Customer, Supplier, Purchase } = require('./src/models');

let mainWindow     
let templatesDir = `file://${__dirname}/templates`

//set ENV 'production'
// process.env.NODE_ENV = 'production'

const basePath = path.join(app.getPath('userData'), 'MyApp')
const storage = (process.env.NODE_ENV === 'production')? basePath: __dirname
const authDB = new Store({ filename: `${storage}/database/auth.db`, autoload: true })
const saleDB = new Store({ filename: `${storage}/database/sale.db`, autoload: true })
const itemDB = new Store({ filename: `${storage}/database/items.db`, autoload: true })
const customerDB = new Store({ filename: `${storage}/database/customer.db`, autoload: true })
const supplierDB = new Store({ filename: `${storage}/database/supplier.db`, autoload: true })
const purchaseDB = new Store({ filename: `${storage}/database/purchase.db`, autoload: true })
customerDB.ensureIndex({ fieldName: 'name', unique: true })
supplierDB.ensureIndex({ fieldName: 'name', unique: true })

//app ready
app.on('ready', () => {   

    mainWindow = new BrowserWindow({ 
        width: 1100,
        height: 700,
        webPreferences: {
            nodeIntegration: true
        },
        frame: false,
        titleBarStyle: "hidden",
    })

    try {
        authDB.find({}, (err, res) => {
            if(res.length !== 0) {
                mainWindow.loadURL(url.format({
                    pathname: path.join(`${templatesDir}/mainWindow.html`)
                }))
            } else {
                mainWindow.loadURL(url.format({
                    pathname: path.join(`${templatesDir}/auth.html`)
                })) 
            }
        })
    } catch {
        mainWindow.loadURL(url.format({
            pathname: path.join(`${templatesDir}/auth.html`)
        })) 
    }

    app.on('close', () => {
        app.quit()
    })

    const mainWindowMenu = Menu.buildFromTemplate(mainWindowMenuTemplate)
    Menu.setApplicationMenu(mainWindowMenu)
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

//creating custom menu template for main window
const mainWindowMenuTemplate = [
    {   
        label: 'Inventory',
        click() {
            openInventoryWindow()
        }
    },
    {
        label: 'Sale',
        click() {
            mainWindow.loadURL(url.format({
                pathname: path.join(`${templatesDir}/mainWindow.html`)
            })) 
        }
    },
    {
        label: 'Purchase',
        click() {
            mainWindow.loadURL(url.format({
                pathname: path.join(`${templatesDir}/purchaseWindow.html`)
            }))
        }
    },
    {
        label: 'History',
        submenu: [
            {
                label: 'Sale History',
                click() {
                    saleHistory()
                }
            },
            {
                label: 'Purchase History',
                click() {
                    purchaseHistory()
                }
            }
        ]
    },
]
menuShift(mainWindowMenuTemplate)
devTools(mainWindowMenuTemplate)

//verification
ipcMain.on('key:verification', (e, data) => {
    
    if(data === '1111') { 
        authDB.insert({ 'auth': 'verified' })
        mainWindow.loadURL(url.format({
            pathname: path.join(`${templatesDir}/mainWindow.html`)
        }))
    }
})

//inventory (items)
const openInventoryWindow = () => {

    mainWindow.loadURL(url.format({
        pathname: `${templatesDir}/inventoryWindow.html`
    }))
}

ipcMain.on('inventoryItems:load', (e, data) => {

    itemDB.find({}).sort({name: 1}).exec((err, res) => {
        mainWindow.webContents.send('inventoryItems:show', res)
    })
})

ipcMain.on('inventoryItems:add', (e, data) => {

    const item = new Item(data['itemName'], data['itemBrand'], data['itemQuantity'], data['itemPrice'])

    itemDB.findOne({
        'name': item.name,
        'brand': item.brand
    }, (err, res) => {
        if(res) {
            itemDB.update({_id: res._id}, {name: res.name, brand: res.brand, quantity: res.quantity + parseInt(data.itemQuantity), price: data.itemPrice}, {})
        } else {
            itemDB.insert(item, (err, data) => {
                console.log(data)
            })
        }
    })
})

ipcMain.on('inventoryItems:delete', (e, data) => {
    itemDB.remove({ _id: data })
})

//sale
ipcMain.on('saleItems:add', async (e, data) => {    
    const items = []
    const total = data.total
    const custName = data.custName
    const custContact = data.custContact
    const date = data.date
    const discount = data.discount
    const stotal = data.stotal
    const dataItems = JSON.parse(data.items)

    customerDB.findOne({ name: custName }, (err, res) => {
        if(res === null) {
            const customer = new Customer(custName, custContact)
            customerDB.insert(customer, (err, data) => {
                if(err) console.log(err.message)
                else console.log(data)
            })
        } else {}
    })

    const getItem = (i) => {
        return new Promise((resolve, reject) => {
            itemDB.findOne({_id: i.id}, (err, res) => {

                itemDB.update({_id: res._id}, {name: res.name, brand: res.brand, quantity: parseInt(res.quantity) -parseInt(i.quantity), price: res.price}, {})
                resolve({'name': res.name, 'brand': res.brand, 'itemid': res._id, 'quantity': i.quantity, 'rate': i.rate})
            })
        })
    }

    const forLoop = async () => {

        for(let i of dataItems) {
            const item = await getItem(i)
            items.push(item)
        }
    }

    const addToSale = items => {
        const sale = new Sale(custName, custContact, date, items, total, discount, stotal)
        saleDB.insert(sale, (err, data) => {
            console.log(data)
            openReceiptWindow(data._id)
        })
    }

    const saleItemAdd = async () => {
        try {
            await forLoop()
            addToSale(items)
        } catch(err) {
            console.log(err.message)
        }
    }

    saleItemAdd()
})

//purchase
ipcMain.on('purchaseItems:add', async (e, data) => {
    const items = []
    const total = data.total
    const supName = data.supName
    const supContact = data.supContact
    const date = data.date
    const discount = data.discount
    const stotal = data.stotal
    const dataItems = JSON.parse(data.items)

    supplierDB.findOne({name: supName}, (err, res) => {
        if(res === null) {
            const supplier = new Supplier(supName, supContact)
            supplierDB.insert(supplier, (err, data) => {
                // console.log(data)
            })
        } else {}
    })

    const updateItemDB = i => {
        return new Promise((resolve, reject) => {
            itemDB.findOne({name: i.name, brand: i.brand}, (err, res) => {
                
                if(res) {
                    itemDB.update({_id: res._id}, {name: i.name, brand: i.brand, quantity: parseInt(res.quantity) +parseInt(i.quantity), price: i.rate}, {})
                } else {
                    const item = new Item(i.name, i.brand, i.quantity, i.rate)
                    itemDB.insert(item)
                }
                resolve()
            })
        })
    }

    const forLoop = async () => {

        for(let i of dataItems) {
            items.push(i)
            await updateItemDB(i)
        }
    }

    const addToPurchase = items => {
        const purchase = new Purchase(supName, supContact, date, items, total, discount, stotal)
        purchaseDB.insert(purchase, (err, data) => {
            console.log(data)
            openReceiptWindow(data._id)
        })
    }

    const purchaseItemAdd = async () => {
        try {
            await forLoop()
            addToPurchase(items)
        } catch(err) {
            console.log(err.message)
        }
    }

    purchaseItemAdd()
})

//history
//sale history
const saleHistory = () => {
    mainWindow.loadURL(url.format({
        pathname: `${templatesDir}/saleHistory.html`
    }))
}

ipcMain.on('historySale:load', (e, data) => {

    saleDB.find({}).sort({date: -1}).exec((err, res) => {
        mainWindow.webContents.send('historySale:show', res)
    })
})

//purchase history
const purchaseHistory = () => {
    mainWindow.loadURL(url.format({
        pathname: `${templatesDir}/purchaseHistory.html`
    }))
}

ipcMain.on('historyPurchase:load', (e, data) => {
    purchaseDB.find({}).sort({date: -1}).exec((err, res) => {
        mainWindow.webContents.send('historyPurchase:show', res)
    })
})

//customers
ipcMain.on('customerList:load', (e, data) => {
    customerDB.find({}).sort({name: 1}).exec((err, res) => {
        mainWindow.webContents.send('customerList:show', res)
    })
})

//suppliers
ipcMain.on('supplierList:load', (e, data) => {
    supplierDB.find({}).sort({name: 1}).exec((err, res) => {
        mainWindow.webContents.send('supplierList:show', res)
    })
})

//receipt
const openReceiptWindow = data => {
    idForReceipt = data
    mainWindow.loadURL(url.format({
        pathname: `${templatesDir}/receipt.html`
    }))
}

let idForReceipt
ipcMain.on('receiptWindow:load', (e, data) => {
    openReceiptWindow(data)
})

ipcMain.on('receipt:load', (e, data) => {
    saleDB.find({_id: idForReceipt}, (err, res) => {
        
        if(res.length === 0) {
            purchaseDB.find({_id: idForReceipt}, (err, doc) => {
                doc.push('PURCHASE')
                mainWindow.webContents.send('receipt:show', doc)
            })
        } else {
            res.push('SALE')
            mainWindow.webContents.send('receipt:show', res)
        }
    })
})

