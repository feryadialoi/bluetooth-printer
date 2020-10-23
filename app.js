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

var printCounter = document.querySelector('.print-counter')

var btnConnect = document.querySelector('#btn-connect')
btnConnect.addEventListener('click', function () {
	setPrinter()
})

var btnPrint = document.querySelector('#btn-print')
btnPrint.addEventListener('click', function () {
	console.log('printing')
	printReceipt()
})

// declare printer
var device
var characteristic
var data
var msg
var isMobile = false
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
	isMobile = true
}
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

async function setPrinter() {
	if (!characteristic || !device) {
		var [_device, _characteristic] = await connectPrinter()
		device = _device
		characteristic = _characteristic
		alert('printer connected')
	} else {
		alert('printer connected')
	}
}

async function printReceipt() {
	try {
		resetStatus()

		let template = templateReceipt()
		msg = templateReceipt()

		templateStatus.innerHTML = 'template'
		templateContent.innerHTML = template

		await setPrinter()

		// const buffer = stringToArrayBuffer(template)

		printingStatus.innerHTML = 'printing...'

		// await characteristic.writeValue(buffer)
		sendTextData()

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

		const _device = await navigator.bluetooth.requestDevice(requestDeviceOptions)
		const server = await _device.gatt.connect()
		const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
		const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')

		setStatus(_device, server, service, characteristic)

		return [_device, characteristic]
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

/* -------------------------------------------------------------------------- */
/*                             from stackoverflow                             */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                 from quasar                                */
/* -------------------------------------------------------------------------- */

function getBytes(text) {
	console.log('text', text)
	let br = '\u000A\u000D'
	text = text === undefined ? br : text
	// let replaced = $languages.replace(text)
	let replaced = text
	console.log('replaced', replaced)
	let bytes = new TextEncoder('utf-8').encode(replaced + br)
	console.log('bytes', bytes)
	return bytes
}
// 2
function addText(arrayText) {
	let text = msg
	arrayText.push(text)
	if (isMobile) {
		while (text.length >= 20) {
			let text2 = text.substring(20)
			arrayText.push(text2)
			text = text2
		}
	}
}
// 1
function sendTextData(device) {
	let arrayText = []
	addText(arrayText)
	console.log('sendTextData => arrayText', arrayText)
	loop(0, arrayText, device)
}
// 3
function loop(i, arrayText, device) {
	let arrayBytes = getBytes(arrayText[i])
	write(device, arrayBytes, () => {
		i++
		if (i < arrayText.length) {
			loop(i, arrayText, device)
		} else {
			let arrayBytes = getBytes()
			write(device, arrayBytes, () => {
				device.gatt.disconnect()
			})
		}
	})
}
// 4
function write(device, array, callback) {
	characteristic
		.writeValue(array)
		.then(() => {
			console.log('Printed Array: ' + array.length)
			setTimeout(() => {
				if (callback) {
					callback()
				}
			}, 250)
		})
		.catch((error) => {
			handleError(error, device)
		})
}
// 5
function handleError(error, device) {
	console.log('handleError-error:', error)
	console.log('handleError-device:', device)
}
/* -------------------------------------------------------------------------- */
/*                                   my own                                   */
/* -------------------------------------------------------------------------- */

function setStatus(device, server, service, characteristic) {
	if (device) {
		deviceStatus.innerHTML = device
	}
	if (server) {
		serverStatus.innerHTML = server
	}
	if (service) {
		serviceStatus.innerHTML = service
	}
	if (characteristic) {
		characteristicStatus.innerHTML = characteristic
	}
}

function resetStatus() {
	deviceStatus.innerHTML = 'status'
	serverStatus.innerHTML = 'status'
	serviceStatus.innerHTML = 'status'
	characteristicStatus.innerHTML = 'status'
	templateContent.innerHTML = ''
	templateStatus.innerHTML = 'status'
	errorStatus.innerHTML = 'status'
	printingStatus.innerHTML = 'status'
}
