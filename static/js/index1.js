const electron = require("electron")
const { ipcRenderer } = electron
const customTitlebar = require('custom-electron-titlebar')

const subTotal = document.getElementById('sub-total')
const items = document.getElementsByClassName('items')
const brands = document.getElementsByClassName('brands')
const quantities = document.getElementsByClassName('quantities')
const rates = document.getElementsByClassName('rates')
const mylist = document.getElementById("myMenu")
const rows = document.getElementsByClassName('row')
const remover = document.getElementsByClassName('remove')
const sls = document.getElementsByClassName('slnos')
const amts = document.getElementsByClassName('amts')
const discount = document.getElementById('discount')
const slist = document.getElementById('supplierList')
const supName = document.getElementById('sup-name')
const supContact = document.getElementById('sup-contact')
const date = document.getElementById('date')
const net = document.getElementById('net')
const dAmount = document.getElementById('discount-amount')

document.addEventListener('DOMContentLoaded', () => {
    new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#0C1427')
    })
    ipcRenderer.send('inventoryItems:load', '')
    ipcRenderer.send('supplierList:load', '')
})

//filling data in row
const fill = e => {
    let tot = parseFloat(subTotal.value)
    items[items.length - 1].value = e.target.getAttribute('name')
    brands[brands.length - 1].value = e.target.getAttribute('brand')
    quantities[quantities.length - 1].value = 1
    rates[rates.length - 1].value = e.target.getAttribute('price')
    amts[amts.length - 1].value = e.target.getAttribute('price')
    let amt = parseFloat(amts[rates.length - 1].value)
    tot += amt
    subTotal.value = Number(tot.toFixed(2))
    mylist.style.display = 'none'
    discountVal()
}

const fillSupplierDetail = e => {
    supName.value = e.target.getAttribute('name')
    supContact.value = e.target.getAttribute('contact')
}

//getting item-list from backend
ipcRenderer.on('inventoryItems:show', (e, data) => {

    for (let i of data) {
        const li = document.createElement('li')
        li.className = 'li'
        const span = document.createElement('span')
        span.className = 'span'
        span.innerHTML += `Name : ${i['name']}<br>Brand : ${i['brand']}<br>Quantity left : ${i['quantity']}`
        span.setAttribute('brand', i.brand)
        span.setAttribute('name', i.name)
        span.setAttribute('price', i.price)
        span.setAttribute('quantity', i.quantity)
        span.addEventListener('click', fill)
        li.appendChild(span)
        mylist.appendChild(li)
    }
})

ipcRenderer.on('supplierList:show', (e, data) => {
    for (let i of data) {

        const li = document.createElement('li')
        li.className = 'li'
        const span = document.createElement('span')
        span.className = 'span'
        span.innerHTML += `name : ${i['name']} &nbsp;&nbsp; contact : ${i['phoneNo']}`
        span.setAttribute('name', i.name)
        span.setAttribute('contact', i.phoneNo)
        span.addEventListener('click', fillSupplierDetail)
        li.appendChild(span)
        slist.appendChild(li)
    }
})

// filter list items
const itemsFilter = e => {
    const filter = e.target.value.toUpperCase()
    const li = document.querySelectorAll(".li")
    const span = document.querySelectorAll(".span")

    for (let i = 0; i < li.length; i++) {

        if (span[i].getAttribute('name').toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = ""
        } else {
            li[i].style.display = "none"
        }
    }
}

//rearranging rows
const listing = index => {

    for (let i = index; i < rows.length; i++) {
        sls[i].innerText = parseInt(i) + 1
        items[i].setAttribute('index', i)
        remover[i].setAttribute('index', i)
        quantities[i].setAttribute('index', i)
        rates[i].setAttribute('index', i)
    }
}

//removing row
const removeItem = e => {
    let tot = parseFloat(subTotal.value)
    const index = e.target.getAttribute('index')
    let amt = parseFloat(amts[index].value)

    if (rows.length > 1) {
        if (amts[index].value !== '')
            tot -= amt
        rows[index].remove()
        listing(index)
    } else {
        items[0].value = ''
        quantities[0].value = 1
        brands[0].value = ''
        rates[0].value = ''
        tot -= amt
        amts[0].value = '0'
    }
    subTotal.value = isNaN(tot) ? 0 : Number(tot.toFixed(2))
    discountVal()
}

//showing data-list
const itemsListShow = e => {

    const index = e.target.getAttribute('index')
    if ((amts[index].value) !== '0') return

    mylist.setAttribute('index', e.target.getAttribute('index'))
    mylist.style.display = 'block'
    mylist.style.left = e.target.offsetLeft + 'px';
    mylist.style.top = e.target.offsetTop + e.target.offsetHeight + 'px';
}

//hiding data-list
const itemsListHide = () => {
    setTimeout(() => {
        mylist.style.display = 'none'
    }, 400)
}

// info
const showInfoMore = (str, delay, col = 'red') => {
    const info = document.querySelector('#info-more')
    info.innerText = str
    // info.style.color = col
    setTimeout(() => {
        info.innerText = ''
    }, delay)
}

//adding rows
const add = () => {

    if (items[items.length - 1].value === ''
        || rates[items.length - 1].value === ''
        || brands[items.length - 1].value === '') {
        showInfoMore('Fill above fields first', 1200)
        return
    }

    const tr = document.createElement('tr')
    const td0 = document.createElement('td')
    const td1 = document.createElement('td')
    const td2 = document.createElement('td')
    const td3 = document.createElement('td')
    const td4 = document.createElement('td')
    const td5 = document.createElement('td')
    const td6 = document.createElement('td')

    const in0 = document.createElement('span')
    in0.innerText = items.length + 1
    in0.className = 'slnos'

    const in1 = document.createElement('input')
    in1.className = 'items'
    in1.classList.add('in')
    in1.addEventListener('keyup', itemsFilter)
    in1.addEventListener('focus', itemsListShow)
    in1.addEventListener('focusout', itemsListHide)
    in1.setAttribute('required', 'required')
    in1.setAttribute('index', items.length)

    const in2 = document.createElement('input')
    in2.className = 'quantities'
    in2.classList.add('in')
    in2.value = 1
    in2.setAttribute('type', 'number')
    in2.setAttribute('required', 'required')
    in2.setAttribute('min', 1)
    in2.setAttribute('index', items.length)
    in2.addEventListener('change', quantityChange)

    const in3 = document.createElement('input')
    in3.className = 'brands'
    in3.classList.add('in')
    in3.setAttribute('required', 'required')

    const in4 = document.createElement('div')
    in4.className = 'remove'
    in4.innerHTML = '&#10006;'
    in4.addEventListener('click', removeItem)
    in4.setAttribute('index', items.length)

    const in5 = document.createElement('input')
    in5.className = 'rates'
    in5.classList.add('in')
    in5.addEventListener('keyup', rateChange)
    in5.setAttribute('required', 'required')
    in5.setAttribute('index', items.length)
    in5.setAttribute('onkeypress', "return isNumberKey(event)")

    const in6 = document.createElement('input')
    in6.className = 'amts'
    in6.value = '0'
    in6.classList.add('read')
    in6.setAttribute('readonly', 'readonly')

    td0.appendChild(in0)
    td1.appendChild(in1)
    td2.appendChild(in2)
    td3.appendChild(in3)
    td4.appendChild(in4)
    td5.appendChild(in5)
    td6.appendChild(in6)

    tr.appendChild(td0)
    tr.appendChild(td1)
    tr.appendChild(td3)
    tr.appendChild(td5)
    tr.appendChild(td2)
    tr.appendChild(td6)
    tr.appendChild(td4)
    tr.className = 'row'

    document.getElementsByTagName('tbody')[0].appendChild(tr)
}

const sendData = data => {
    ipcRenderer.send('purchaseItems:add', data)
}

//form submit sending data
document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault()
    const data = []

    for (let i = 0; i < items.length; i++) {

        data.push({
            'name': items[i].value,
            'quantity': quantities[i].value,
            'rate': rates[i].value,
            'brand': brands[i].value,
            'amount': amts[i].value
        })
    }

    sendData({
        'items': JSON.stringify(data),
        'total': net.value,
        'supName': supName.value,
        'supContact': supContact.value,
        'date': date.value.split("-").reverse().join("-"),
        'discount': dAmount.value,
        'stotal': subTotal.value
    })
})

const quantityChange = e => {
    e.stopPropagation()
    let q = e.target.value
    if( q === '') q = 0
    const index = e.target.getAttribute('index')
    let tot = parseFloat(subTotal.value)
    let rate = parseFloat(rates[index].value)
    tot -= parseFloat(amts[index].value)
    amts[index].value = (parseFloat(q) * rate).toFixed(2)
    tot += parseFloat(amts[index].value)
    subTotal.value = Number(tot.toFixed(2))
    discountVal()
}

const rateChange = e => {
    const index = e.target.getAttribute('index')
    const rate = parseFloat(rates[index].value)
    let tot = parseFloat(subTotal.value)
    let amt = parseFloat(amts[index].value)
    tot -= amt
    amt = parseFloat(quantities[index].value) * rate
    amts[index].value = isNaN(amt) ? 0 : Number(amt.toFixed(2))
    tot += amt
    subTotal.value = isNaN(tot) ? 0 : Number(tot.toFixed(2))
    discountVal()
}

let flag = false
const discountVal = () => {

    if(flag) {
        let tot = parseFloat(subTotal.value)
        const disc = isNaN(parseFloat(discount.value))? 0: parseFloat(discount.value)
        tot -= tot *(disc /100)
        net.value = Number(tot.toFixed(2))
        dAmount.value = Number((parseFloat(subTotal.value) -tot).toFixed(2))
    } else {
        let tot = parseFloat(subTotal.value)
        const dAmt = isNaN(parseFloat(dAmount.value))? 0: parseFloat(dAmount.value)
        net.value = Number((tot -dAmt).toFixed(2))
        tot = dAmt/tot *100
        discount.value = Number(tot.toFixed(2))
    }
}

items[0].addEventListener('keyup', itemsFilter)
items[0].addEventListener('focus', itemsListShow)
items[0].addEventListener('focusout', itemsListHide)
remover[0].addEventListener('click', removeItem)
quantities[0].addEventListener('change', quantityChange)
rates[0].addEventListener('keyup', rateChange)
discount.addEventListener('change', discountVal)
discount.addEventListener('keyup', discountVal)
discount.addEventListener('focus', () => flag = true)
dAmount.addEventListener('focus', () => flag = false)
dAmount.addEventListener('keyup', discountVal)

supName.addEventListener('focus', e => {
    slist.style.display = 'block'
    slist.style.left = e.target.offsetLeft + 'px';
    slist.style.top = e.target.offsetTop + e.target.offsetHeight + 'px';
})

supName.addEventListener('focusout', () => {
    setTimeout(() => {
        slist.style.display = 'none'
    }, 400)
})

supName.addEventListener('keyup', e => {
    const filter = e.target.value.toUpperCase()
    const li = document.querySelectorAll("#customerList .li")
    const span = document.querySelectorAll("#customerList .li .span")

    for (let i = 0; i < li.length; i++) {

        if (span[i].getAttribute('name').toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = ""
        } else {
            li[i].style.display = "none"
        }
    }
})

function isNumberKey(evt){

    if(evt.key === '.' && !evt.target.value.includes('.')) return true
    
    const charCode = (evt.which) ? evt.which : evt.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }
    return true;
}