// Налаштування шаблону
import templateConfig from '../template.config.js'
// Логгер
import logger from './logger.js'

import notifier from 'node-notifier'

global.coffeeInterval

export default function coffeeTime() {
	if (!global.coffeeInterval) {
		global.coffeeInterval = setInterval(() => {
			logger(templateConfig.coffee.text)

			if (templateConfig.coffee.notification) {
				notifier.notify({
					title: 'Coffee Time',
					message: templateConfig.coffee.text,
					sound: true,
				})
			}

		}, templateConfig.coffee.interval * 60000);
	}
}