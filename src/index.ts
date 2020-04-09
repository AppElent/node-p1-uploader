import moment from 'moment-timezone';
import pg from 'pg';
import fs from 'fs';
//import fetch from "node-fetch";
import { Sequelize, Model, DataTypes, Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

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

//Doel database
pg.defaults.ssl = true;
const meterstandenDev = new Sequelize(process.env.connectionStringDev ?? '');
const meterstandenStaging = new Sequelize(process.env.connectionStringStaging ?? '');
const meterstandenProd = new Sequelize(process.env.connectionStringProd ?? '');

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

class MeterstandenDev extends Model {
    public datetime: Date;
    public userId: string;
    public value: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

class MeterstandenStaging extends Model {
    public datetime: Date;
    public userId: string;
    public value: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

class MeterstandenProd extends Model {
    public datetime: Date;
    public userId: string;
    public value: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

MeterstandenDev.init(
    {
        datetime: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            get(this: MeterstandenDev): Date {
                return moment(this.getDataValue('datetime'))
                    .tz('Europe/Amsterdam')
                    .toDate();
            },
            unique: true,
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
        sequelize: meterstandenDev,
    },
);

MeterstandenStaging.init(
    {
        datetime: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            get(this: MeterstandenStaging): Date {
                return moment(this.getDataValue('datetime'))
                    .tz('Europe/Amsterdam')
                    .toDate();
            },
            unique: true,
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
        sequelize: meterstandenStaging,
    },
);

MeterstandenProd.init(
    {
        datetime: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            get(this: MeterstandenProd): Date {
                return moment(this.getDataValue('datetime'))
                    .tz('Europe/Amsterdam')
                    .toDate();
            },
            unique: true,
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
        sequelize: meterstandenProd,
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
            180: stand['181'] + stand['182'],
            181: stand['181'],
            182: stand['182'],
            280: stand['281'] + stand['282'],
            281: stand['281'],
            282: stand['282'],
            userId: '00uaz3xmdoobfWWnY356',
        };
        if (postObject.filter((e: any) => e.datetime === rounded).length === 0) {
            postObject.push(values);
        }
    }

    await MeterstandenDev.destroy({
        where: {
            datetime: {
                [Op.lt]: moment()
                    .subtract(3, 'days')
                    .startOf('day')
                    .toDate(),
            },
        },
    });
    await MeterstandenStaging.destroy({
        where: {
            datetime: {
                [Op.lt]: moment()
                    .subtract(3, 'days')
                    .startOf('day')
                    .toDate(),
            },
        },
    });
    await MeterstandenProd.destroy({
        where: {
            datetime: {
                [Op.lt]: moment()
                    .subtract(3, 'days')
                    .startOf('day')
                    .toDate(),
            },
        },
    });

    //console.log(postObject);
    //await meterstandenDev.sync({ force: true });
    //await meterstandenStaging.sync({ force: true });
    await MeterstandenDev.bulkCreate(postObject, { updateOnDuplicate: ['181', '182', 'updated_at'] });
    await MeterstandenStaging.bulkCreate(postObject, { updateOnDuplicate: ['181', '182', 'updated_at'] });
    //await meterstandenProd.sync({ force: true });
    await MeterstandenProd.bulkCreate(postObject, { updateOnDuplicate: ['181', '182', 'updated_at'] });

    return;
};

updateMeterstanden();
