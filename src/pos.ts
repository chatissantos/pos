const readline = require('readline');
const csv = require('csv-parser');
const fs = require('fs');
import {Product} from './model';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});


const products: Array<Product> = [];
let cart: Array<Product> = [];
let subtotal = 0;
let totalTax = 0;
let totalStateTax = 0;
let totalCountyTax = 0;
let totalCityTax = 0;
let total = 0;
let amountPaidByCustomer = 0;
let customerChange = 0;
fs.createReadStream('./resources/products.csv')
    .pipe(csv())
    .on('data', (data: Product) => {
        products.push({...data, price: parseFloat(data.price.toString()), tax: getTax(data.price, data.category)});
    })
    .on('end', () => {
        console.log('POS is Ready!!');
        startTransaction();
    });
function startTransaction() {
    cart = [];
    subtotal = 0;
    totalTax = 0;
    totalStateTax = 0;
    totalCountyTax = 0;
    totalCityTax = 0;
    total = 0;
    console.log('\n\n');
    console.log('=====================================');
    console.log('          New Transaction');
    console.log('=====================================');
    console.log('----Ringing Products----');
    takeProductInput();
}
function processInput(input: string) {
    if (input === 'total') {
        runTotal();
    } else {
        processProductId(input);
    }
}
function processProductId(productId: string) {
    const results = search(productId);
    switch (results.length) {
        case 0:
            console.log('Not found: ', productId);
            break;
        case 1:
            runProduct(results[0]);
            break;
        default:
            for(let product of results) {
                console.log(product.id, ': ', product.name);
            }
            break;
    }
    takeProductInput();
}
function search(productId: string) {
    return products.filter(product => {
        return product.id.startsWith(productId)
    });
}
function runProduct(product: Product) {
    cart.push(product);
    console.log(product.name, '\t\t', product.price);
}
function runTotal() {
    if (cart.length === 0) {
        takeProductInput();
        return;
    }
    console.log('\n\n');
    console.log('----Running Total----');
    subtotal = cart.reduce((accumulator, currentValue) => accumulator + currentValue.price, 0);
    totalTax = cart.reduce((accumulator, currentValue) => accumulator + currentValue.tax.total, 0);
    totalStateTax = cart.reduce((accumulator, currentValue) => accumulator + currentValue.tax.state, 0);
    totalCountyTax = cart.reduce((accumulator, currentValue) => accumulator + currentValue.tax.county, 0);
    totalCityTax = cart.reduce((accumulator, currentValue) => accumulator + currentValue.tax.city, 0);
    total = subtotal + totalTax;
    console.log('Subtotal:\t\t\t\t\t', subtotal);
    console.log('Tax:\t\t\t\t\t\t', totalTax);
    console.log('Total:\t\t\t\t\t\t', total);
    takeCustomerAmountPaidInput();
}
function processCustomerAmountPaid(amount: number) {
    amountPaidByCustomer = amount;
    customerChange = amount - total;
    endTransaction();
}
function endTransaction() {
    console.log('\n\n');
    console.log('----Receipt----');
    const itemLines = [];
    for (let product of cart) {
        itemLines.push({
            ProductID: product.id,
            Description: product.name,
            Price: product.price,
            'Tax Category': product.category
        });
        console.log(product.id, ' ', product.name, ' (', product.category, ')\t\t\t', product.price);
    }
    console.log('\n');
    console.log('Subtotal:\t\t\t\t\t\t', subtotal);
    console.log('State Tax:\t\t\t\t\t\t', totalStateTax);
    console.log('County Tax:\t\t\t\t\t\t', totalCountyTax);
    console.log('City Tax:\t\t\t\t\t\t', totalCityTax);
    console.log('Total Tax:\t\t\t\t\t\t', totalTax);
    console.log('Total:\t\t\t\t\t\t\t', total);
    console.log('AmountPaid:\t\t\t\t\t\t', amountPaidByCustomer);
    console.log('Change Due:\t\t\t\t\t\t', customerChange);
    startTransaction();
}
function getTax(price: number, category: string) {
    const stateTaxRate = .063;
    const countyTaxRate = .007;
    const cityTaxRate = .02;

    const stateTax = category === 'g' ? 0 : price * stateTaxRate;
    const countyTax = category === 'g' ? 0 : price * countyTaxRate;
    const cityTax = price * cityTaxRate;
    return {
        state: stateTax,
        county: countyTax,
        city: cityTax,
        total: stateTax + countyTax + cityTax
    };
}
function takeProductInput() {
    rl.question('Product ID: ', (answer: string) => {
        processInput(answer);
    });
}
function takeCustomerAmountPaidInput() {
    rl.question('Amount Paid: ', (answer: string) => {
        processCustomerAmountPaid(parseFloat(answer));
    });
}
