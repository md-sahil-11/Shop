class Sale {
    constructor(customerName, customerContact, date, item, total, discount, stotal) {
        this.customerName = customerName
        this.customerContact = customerContact
        this.items = item
        this.totalAmt = total
        this.date = date
        this.discount = discount
        this.subTotal = stotal
    }
}

class Item {
    constructor(name, brand, quantity, price) {
        this.name = name 
        this.brand = brand
        this.quantity = quantity
        this.price = price
    }
}

class Purchase {
    constructor(sName, sContact, date, items, total, discount, stotal) {
        this.sName = sName
        this.sContact = sContact
        this.date = date
        this.items = items
        this.totalAmt = total
        this.discount = discount
        this.subTotal = stotal
    }
}

class Customer {
    constructor(name, phoneNo) {
        this.name = name
        this.phoneNo = phoneNo
    }
}

class Supplier {
    constructor(name, phoneNo) {
        this.name = name
        this.phoneNo = phoneNo
    }
}

module.exports = {
    Sale,
    Item,
    Purchase,
    Customer,
    Supplier
}