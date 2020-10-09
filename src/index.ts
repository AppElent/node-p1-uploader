#!/usr/bin/env node

import yargs from 'yargs';
const argv = yargs.argv;

console.log(argv.test);

if (!argv.key) {
    throw 'Key not given';
}

if (!argv.endpoint) {
    throw 'Endpoint not found';
}

import moment from 'moment-timezone';
import axios from 'axios';
import fs from 'fs';
//import fetch from "node-fetch";
import { Sequelize, Model, DataTypes } from 'sequelize';

const path = '/home/pi/domoticz/domoticz.db';
const deviceID = 1;

console.log('Start loading p1 data..');

//Bron database
let realpath = './domoticz.db';
try {
    if (fs.existsSync(path)) {
        realpath = path;
    }
} catch (err) {
    console.error(err);
}
const domoticz = new Sequelize({
    database: 'domoticzDB',
    dialect: 'sqlite',
    storage: realpath,
});

class MultiMeter extends Model {
    public DeviceRowID: number;
    public 181: number;
    public 281: number;
    public value3: number;
    public value4: number;
    public 182: number;
    public 282: number;
    public Date: Date;
}

MultiMeter.init(
    {
        DeviceRowID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        181: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'Value1',
        },
        281: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'Value2',
        },
        value3: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'Value3',
        },
        value4: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'Value4',
        },
        182: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'Value5',
        },
        282: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'Value6',
        },
        Date: {
            type: DataTypes.STRING,
            allowNull: false,
            get: function (this: MultiMeter): Date {
                return moment
                    .tz(moment(this.getDataValue('Date')).utc().format('YYYY-MM-DD HH:mm:ss'), 'Europe/Amsterdam')
                    .toDate();
            },
        },
    },
    {
        tableName: 'MultiMeter',
        sequelize: domoticz,
        timestamps: false,
    },
);

MultiMeter.removeAttribute('id');

const updateMeterstanden = async (): Promise<void> => {
    /*
	const meterstanden = await MultiMeter.findAll({
        where: {
            DeviceRowID: deviceID,
        },
	});
	*/
    const meterstanden = await MultiMeter.findAll();

    const postObject = [];

    for (const stand of meterstanden) {
        const datum = new Date(stand.Date);
        datum.setSeconds(0);
        const coeff = 1000 * 60 * 5;
        const rounded = new Date(Math.round(datum.getTime() / coeff) * coeff);
        if (![0, 15, 30, 45].includes(rounded.getMinutes())) {
            //continue;
        }

        const values = {
            datetime: rounded,
            kwh_180: stand['181'] + stand['182'],
            kwh_181: stand['181'],
            kwh_182: stand['182'],
            kwh_280: stand['281'] + stand['282'],
            kwh_281: stand['281'],
            kwh_282: stand['282'],
        };
        if (postObject.filter((e: any) => e.datetime === rounded).length === 0) {
            postObject.push(values);
        }
    }

    //const resultLocal = await axios.post('http://192.168.178.122:3001/api/meterstanden', postObject);
    //const resultDev = await axios.post('https://appelent-api-dev.herokuapp.com/api/meterstanden', postObject);
    //const resultStaging = await axios.post('https://appelent-api-staging.herokuapp.com/api/meterstanden', postObject);
    const url = argv.endpoint + '/api/meterstanden/';
    const resultProd = await axios.post(url, postObject, {
        headers: { Authorization: 'Token ' + argv.key },
    });
};

updateMeterstanden();
