var productsElement = document.querySelectorAll('.product-order')

// parsing data from element
var products = [...productsElement].map((productElement) => {
	return {
		name: productElement.querySelector('[data-product-name]').dataset.productName,
		price: productElement.querySelector('[data-product-price]').dataset.productPrice,
		quantity: productElement.querySelector('[data-product-quantity]').dataset.productQuantity,
	}
})

// declaration button var
var deviceStatus = document.querySelector('.device-status')
var serverStatus = document.querySelector('.server-status')
var serviceStatus = document.querySelector('.service-status')
var characteristicStatus = document.querySelector('.characteristic-status')

var btnConnect = document.querySelector('#btn-connect')
btnConnect.addEventListener('click', function () {
	connectPrinter()
})

var btnPrint = document.querySelector('#btn-print')
btnPrint.addEventListener('click', function () {
	console.log('printing')
	printReceipt()
})

/* -------------------------------------------------------------------------- */
/*                             async/await version                            */
/* -------------------------------------------------------------------------- */

function templateReceipt() {
	let template = ''
	template += '===============================\n\n'

	products.forEach((product) => {
		template += `${product.name} : ${product.quantity}\n`
		template += `Rp ${product.price * product.quantity}\n`
	})

	template += '================================\n'
	template += '\n\n\n'
	return template
}

async function printReceipt() {
	try {
		const template = templateReceipt()

		const characteristic = await connectPrinter()
		const buffer = stringToArrayBuffer(template)

		characteristic?.writeValue(buffer)
	} catch (error) {
		console.log('error print receipt', error)
	}
}

async function connectPrinter() {
	try {
		const requestDeviceOptions = {
			acceptAllDevices: true,
			optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
		}
		const device = await navigator.bluetooth.requestDevice(requestDeviceOptions)
		if (device) {
			deviceStatus.innerHTML = device
		}
		const server = await device.gatt.connect()
		const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
		const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')
		return characteristic
	} catch (error) {
		console.log('error connect printer', error)
	}
}
function stringToArrayBuffer(text) {
	const encoder = new TextEncoder()
	const encoded = encoder.encode(text)
	console.log('encoded', encoded)
	return encoded.buffer
}
