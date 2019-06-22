import '@babel/polyfill';
import moment from 'moment-timezone';
import fetch from "node-fetch";
import dotenv from 'dotenv';
const Sequelize = require('sequelize');
dotenv.config();

console.log('Start loading p1 data..');

const sequelize = new Sequelize('domoticzDB', null, null, {
    dialect: "sqlite",
    storage: process.env.DATABASE_FILE
});


const MultiMeter = sequelize.define('MultiMeter', {
    DeviceRowID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    181: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'Value1',
    },
    281: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'Value2',
    },
    Value3: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    Value4: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    182: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'Value5',
    },
    282: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'Value6',
    },
    Date: {
      type: Sequelize.STRING,
      allowNull: false,
      get: function () {
          return moment.tz(moment(this.getDataValue('Date')).utc().format('YYYY-MM-DD HH:mm:ss'), 'Europe/Amsterdam');
      }
    }
},{
tableName: 'MultiMeter',
timestamps: false,
});
MultiMeter.removeAttribute('id');

const updateMeterstanden = async (force: boolean) => {

	let meterstanden = await MultiMeter.findAll({
	  where: {
		DeviceRowID: process.env.DEVICE_ROWID
	  }
	});
	
	const lastentry = await MultiMeter.findOne({
		where: {
			user: '00uaz3xmdoobfWWnY356'
		},
		order: [ [ 'datetime', 'DESC' ]]
	})
	let lastdate = moment().add(-1, 'days')
	if(lastentry !== null){
		console.log('Meterstanden moeten vanaf ' + moment(lastentry.datetime).format('YYYY-MM-DD HH:mm') + ' worden bijgewerkt');
		lastdate = lastentry.datetime;
	}
	
	//Geforceerd alles laten
	if(force){
		meterstanden = meterstanden.filter((item) =>
			new Date(item.Date) >= (new Date(lastdate))
		);
	}

	
	//console.log('test', meterstanden);
	
	
	for(const stand of meterstanden){
		let datum = new Date(stand.Date);
		datum.setSeconds(0);
		
		var coeff = 1000 * 60 * 5;
		var date = new Date(datum);  //or use any other date
		var rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
		console.log(datum, stand.Date, rounded);

		let values = {
			datetime: rounded,
			180: ((stand['181'] + stand['182'])),
			181: stand['181'], 
			182: stand['182'],
			280: ((stand['281'] + stand['282'])),
			281: stand['281'],
			282: stand['282'],
			user: '00uaz3xmdoobfWWnY356'
		}
		var gevondenmeterstand = await MultiMeter.findOne({ where: {datetime: rounded, user: '00uaz3xmdoobfWWnY356'} });
		if(gevondenmeterstand == null){
			gevondenmeterstand = await MultiMeter.create(values);
		}else{
			gevondenmeterstand = await gevondenmeterstand.update(values);
		}

	}
	
	const allm = await MultiMeter.findAll({
		where: {
			datetime: {
			$gte: moment().subtract(7, 'days').startOf('day').toDate()
			}
		}
	})
	
	return allm;
}