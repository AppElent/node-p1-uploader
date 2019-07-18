import '@babel/polyfill';
import moment from 'moment-timezone';
import fetch from "node-fetch";
import dotenv from 'dotenv';
import Sequelize from 'sequelize';
//const Sequelize = require('sequelize');
dotenv.config();
const Op = Sequelize.Op;

console.log('Start loading p1 data..');

const domoticz = new Sequelize('domoticzDB', null, null, {
    dialect: "sqlite",
    storage: '/home/pi/domoticz/domoticz.db'
});
var pg = require('pg');
pg.defaults.ssl = true;
const database = new Sequelize(process.env.DATABASE_URL);


const MultiMeter = domoticz.define('MultiMeter', {
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

const Meterstanden = database.define('meterstanden', {
  datetime: {
	type: Sequelize.DATE,
	get: function () {
		return moment(this.getDataValue('datetime')).tz('Europe/Amsterdam');//.format('YYYY-MM-DD HH:mm:ss');
	}
  },
  user: {
	type: Sequelize.STRING,
	allowNull: false,
  },
  180: {
	type: Sequelize.STRING
  },181: {
	type: Sequelize.STRING
  },182: {
	type: Sequelize.STRING
  },280: {
	type: Sequelize.STRING
  },281: {
	type: Sequelize.STRING
  },282: {
	type: Sequelize.STRING
  },
},{
  tableName: 'meterstanden',
});

const updateMeterstanden = async (forceUpdate = false) => {

	let meterstanden = await MultiMeter.findAll({
	  where: {
		DeviceRowID: 3
	  }
	});
	
	//console.log('meterstanden', meterstanden);
	
	const lastentry = await Meterstanden.findOne({
		where: {
			//your where conditions, or without them if you need ANY entry
			user: '00uaz3xmdoobfWWnY356'
		},
		order: [ [ 'datetime', 'DESC' ]]
	})
	let lastdate = moment().add(-1, 'days')
	if(lastentry !== null){
		console.log('Meterstanden moeten vanaf ' + moment(lastentry.datetime).format('YYYY-MM-DD HH:mm') + ' worden bijgewerkt');
		lastdate = lastentry.datetime;
	}
	
	
	if(forceUpdate === false){
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
		//console.log(values);
		var gevondenmeterstand = await Meterstanden.findOne({ where: {datetime: rounded, user: '00uaz3xmdoobfWWnY356'} });
		if(gevondenmeterstand == null){
			gevondenmeterstand = await Meterstanden.create(values);
			//console.log("Moet toegevoegd worden");
		}else{
			gevondenmeterstand = await gevondenmeterstand.update(values);
			//console.log("Moet geupdate worden");
		}

	}
	
	await Meterstanden.destroy({
		where: {
			datetime: {
				[Op.lt]: moment().subtract(3, 'days').startOf('day').toDate()
			}
		}
	})
	
	return;
}

updateMeterstanden(false);
