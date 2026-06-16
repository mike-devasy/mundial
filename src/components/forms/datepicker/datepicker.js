// Підключення модуля
import datepicker from 'js-datepicker';

import langs from "./_lang.json"
import './datepicker.scss'

const datePickers = document.querySelectorAll('[data-fls-datepicker]')

if (datePickers.length) {
	const LANG = 'ua' // en
	window.flsDatepicker = []

	datePickers.forEach(datePicker => {
		let datePickerItem = datepicker(datePicker, {
			customDays: langs[LANG].week,
			customMonths: langs[LANG].month,
			overlayButton: langs[LANG].button,
			overlayPlaceholder: langs[LANG].year,
			startDay: 1,
			formatter: (input, date, instance) => {
				const value = date.toLocaleDateString()
				input.value = value
			},
			onSelect: function (input, instance, date) { }
		})
		window.flsDatepicker.push(datePickerItem)
	})
}
