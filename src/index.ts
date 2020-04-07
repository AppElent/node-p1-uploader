import moment from 'moment-timezone';
import pg from 'pg';
import fs from 'fs';
//import fetch from "node-fetch";
import { Sequelize, Model, DataTypes, Op } from 'sequelize';

const path = '/home/pi/domoticz/domoticz.db';
const pgdatabase =
    'postgres://gsqxejvdzesobm:a310ed0ea0b99bfb6aca7ef2b7aa7dedace647c1e70bb391bec89406c113523d@ec2-54-228-243-29.eu-west-1.compute.amazonaws.com:5432/d28ih0f60di1pl';
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

//Doel database
pg.defaults.ssl = true;
const meterstanden = new Sequelize(pgdatabase);

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
            get: function(this: MultiMeter): Date {
                return moment
                    .tz(
                        moment(this.getDataValue('Date'))
                            .utc()
                            .format('YYYY-MM-DD HH:mm:ss'),
                        'Europe/Amsterdam',
                    )
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

export default class Meterstanden extends Model {
    public datetime: Date;
    public userId: string;
    public value: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Meterstanden.init(
    {
        datetime: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            get(this: Meterstanden): Date {
                return moment(this.getDataValue('datetime'))
                    .tz('Europe/Amsterdam')
                    .toDate();
            },
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        180: {
            type: DataTypes.INTEGER,
        },
        181: {
            type: DataTypes.INTEGER,
        },
        182: {
            type: DataTypes.INTEGER,
        },
        280: {
            type: DataTypes.INTEGER,
        },
        281: {
            type: DataTypes.INTEGER,
        },
        282: {
            type: DataTypes.INTEGER,
        },
    },
    {
        tableName: 'meterstanden',
        sequelize: meterstanden,
    },
);

const updateMeterstanden = async (): Promise<void> => {
    /*
	const meterstanden = await MultiMeter.findAll({
        where: {
            DeviceRowID: deviceID,
        },
	});
	*/
    const meterstanden = await MultiMeter.findAll();

    //console.log('meterstanden', meterstanden);
    /*
    const lastentry = await Meterstanden.findOne({
        where: {
            //your where conditions, or without them if you need ANY entry
            user: '00uaz3xmdoobfWWnY356',
        },
        order: [['datetime', 'DESC']],
    });
    let lastdate: Date = moment()
        .add(-1, 'days')
        .toDate();
    if (lastentry !== null) {
        console.log(
            'Meterstanden moeten vanaf ' + moment(lastentry.datetime).format('YYYY-MM-DD HH:mm') + ' worden bijgewerkt',
        );
        lastdate = lastentry.datetime;
    }

    if (forceUpdate === false) {
        meterstanden = meterstanden.filter(item => new Date(item.Date) >= new Date(lastdate));
	}
	*/

    //console.log('test', meterstanden);

    const postObject = [];

    for (const stand of meterstanden) {
        const datum = new Date(stand.Date);
        datum.setSeconds(0);
        const coeff = 1000 * 60 * 5;
        const rounded = new Date(Math.round(datum.getTime() / coeff) * coeff);
        if (![0, 15, 30, 45].includes(rounded.getMinutes())) {
            continue;
        }

        const values = {
            datetime: rounded,
            180: stand['181'] + stand['182'],
            181: stand['181'],
            182: stand['182'],
            280: stand['281'] + stand['282'],
            281: stand['281'],
            282: stand['282'],
            user: '00uaz3xmdoobfWWnY356',
        };
        postObject.push(values);
        //console.log(values);

        /*
        const allmeterstanden = await Meterstanden.findAll({
            where: { user: '00uaz3xmdoobfWWnY356' },
        });
        const gevondenmeterstand = allmeterstanden.find(row => row.datetime === rounded);
        if (gevondenmeterstand === undefined) {
            await Meterstanden.create(values);
        } else {
            await gevondenmeterstand.update(values);
		}
		*/
    }
    console.log(postObject);

    /*
    await Meterstanden.destroy({
        where: {
            datetime: {
                [Op.lt]: moment()
                    .subtract(3, 'days')
                    .startOf('day')
                    .toDate(),
            },
        },
    });
*/
    return;
};

updateMeterstanden();
