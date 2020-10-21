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
var templateStatus = document.querySelector('.template-status')
var printingStatus = document.querySelector('.printing-status')
var templateContent = document.querySelector('.template-content')
var errorStatus = document.querySelector('.error-status')

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
	// template += '===============================\n\n'

	products.forEach((product) => {
		template += `${product.name} : ${product.quantity}\n`
		template += `Rp ${product.price * product.quantity}\n`
	})

	// template += '================================\n'
	template += '\n\n\n'
	return template
}

async function printReceipt() {
	try {
		let template = templateReceipt()
		template = '1234567890abcdefghij!@#$%^&*()_+\n'

		templateStatus.innerHTML = 'template'
		templateContent.innerHTML = template

		const characteristic = await connectPrinter()

		console.log('characteristic', characteristic)

		const buffer = stringToArrayBuffer(template)

		printingStatus.innerHTML = 'printing...'

		const written = await characteristic?.writeValue(buffer)
		console.log('written', written)

		// await writeChunk(characteristic, template)

		printingStatus.innerHTML = 'printing done'
	} catch (error) {
		console.log('error print receipt', error)
		errorStatus.innerHTML = 'error: ' + error?.name + ', ' + error?.message
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
		if (server) {
			serverStatus.innerHTML = server
		}
		const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
		if (service) {
			serviceStatus.innerHTML = service
		}
		const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')
		if (characteristic) {
			characteristicStatus.innerHTML = characteristic
		}
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

function writeStrToCharacteristic(characteristic, str) {
	let buffer = new ArrayBuffer(str.length)
	let dataView = new DataView(buffer)
	for (var i = 0; i < str.length; i++) {
		dataView.setUint8(i, str.charAt(i).charCodeAt())
	}
	console.log('accessing the device')
	return characteristic.writeValue(buffer)
}

function writeChunk(characteristic, textString) {
	return new Promise((resolve, reject) => {
		try {
			var maxChunk = 300
			var j = 0

			if (textString.length > maxChunk) {
				for (var i = 0; i < textString.length; i += maxChunk) {
					var subStr
					if (i + maxChunk <= textString.length) {
						subStr = textString.substring(i, i + maxChunk)
					} else {
						subStr = textString.substring(i, textString.length)
					}

					setTimeout(writeStrToCharacteristic, 250 * j, subStr)
					j++
				}
			} else {
				writeStrToCharacteristic(characteristic, textString)
			}

			resolve('print done')
		} catch (error) {
			reject(error)
		}
	})
}
