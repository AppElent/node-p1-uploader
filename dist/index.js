"use strict";

require("@babel/polyfill");

var _momentTimezone = _interopRequireDefault(require("moment-timezone"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _dotenv = _interopRequireDefault(require("dotenv"));

var _sequelize = _interopRequireDefault(require("sequelize"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

//const Sequelize = require('sequelize');
_dotenv["default"].config();

var Op = _sequelize["default"].Op;
console.log('Start loading p1 data..');
var domoticz = new _sequelize["default"]('domoticzDB', null, null, {
  dialect: "sqlite",
  storage: '/home/pi/domoticz/domoticz.db'
});

var pg = require('pg');

pg.defaults.ssl = true;
var database = new _sequelize["default"](process.env.DATABASE_URL);
var MultiMeter = domoticz.define('MultiMeter', {
  DeviceRowID: {
    type: _sequelize["default"].INTEGER,
    allowNull: false
  },
  181: {
    type: _sequelize["default"].INTEGER,
    allowNull: false,
    field: 'Value1'
  },
  281: {
    type: _sequelize["default"].INTEGER,
    allowNull: false,
    field: 'Value2'
  },
  Value3: {
    type: _sequelize["default"].INTEGER,
    allowNull: false
  },
  Value4: {
    type: _sequelize["default"].INTEGER,
    allowNull: false
  },
  182: {
    type: _sequelize["default"].INTEGER,
    allowNull: false,
    field: 'Value5'
  },
  282: {
    type: _sequelize["default"].INTEGER,
    allowNull: false,
    field: 'Value6'
  },
  Date: {
    type: _sequelize["default"].STRING,
    allowNull: false,
    get: function get() {
      return _momentTimezone["default"].tz((0, _momentTimezone["default"])(this.getDataValue('Date')).utc().format('YYYY-MM-DD HH:mm:ss'), 'Europe/Amsterdam');
    }
  }
}, {
  tableName: 'MultiMeter',
  timestamps: false
});
MultiMeter.removeAttribute('id');
var Meterstanden = database.define('meterstanden', {
  datetime: {
    type: _sequelize["default"].DATE,
    get: function get() {
      return (0, _momentTimezone["default"])(this.getDataValue('datetime')).tz('Europe/Amsterdam'); //.format('YYYY-MM-DD HH:mm:ss');
    }
  },
  user: {
    type: _sequelize["default"].STRING,
    allowNull: false
  },
  180: {
    type: _sequelize["default"].STRING
  },
  181: {
    type: _sequelize["default"].STRING
  },
  182: {
    type: _sequelize["default"].STRING
  },
  280: {
    type: _sequelize["default"].STRING
  },
  281: {
    type: _sequelize["default"].STRING
  },
  282: {
    type: _sequelize["default"].STRING
  }
}, {
  tableName: 'meterstanden'
});

var updateMeterstanden =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var forceUpdate,
        meterstanden,
        lastentry,
        lastdate,
        _iteratorNormalCompletion,
        _didIteratorError,
        _iteratorError,
        _iterator,
        _step,
        stand,
        datum,
        coeff,
        date,
        rounded,
        values,
        gevondenmeterstand,
        _args = arguments;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            forceUpdate = _args.length > 0 && _args[0] !== undefined ? _args[0] : false;
            _context.next = 3;
            return MultiMeter.findAll({
              where: {
                DeviceRowID: 3
              }
            });

          case 3:
            meterstanden = _context.sent;
            _context.next = 6;
            return Meterstanden.findOne({
              where: {
                //your where conditions, or without them if you need ANY entry
                user: '00uaz3xmdoobfWWnY356'
              },
              order: [['datetime', 'DESC']]
            });

          case 6:
            lastentry = _context.sent;
            lastdate = (0, _momentTimezone["default"])().add(-1, 'days');

            if (lastentry !== null) {
              console.log('Meterstanden moeten vanaf ' + (0, _momentTimezone["default"])(lastentry.datetime).format('YYYY-MM-DD HH:mm') + ' worden bijgewerkt');
              lastdate = lastentry.datetime;
            }

            if (forceUpdate === false) {
              meterstanden = meterstanden.filter(function (item) {
                return new Date(item.Date) >= new Date(lastdate);
              });
            } //console.log('test', meterstanden);


            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 13;
            _iterator = meterstanden[Symbol.iterator]();

          case 15:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 39;
              break;
            }

            stand = _step.value;
            datum = new Date(stand.Date);
            datum.setSeconds(0);
            coeff = 1000 * 60 * 5;
            date = new Date(datum); //or use any other date

            rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
            console.log(datum, stand.Date, rounded);
            values = {
              datetime: rounded,
              180: stand['181'] + stand['182'],
              181: stand['181'],
              182: stand['182'],
              280: stand['281'] + stand['282'],
              281: stand['281'],
              282: stand['282'],
              user: '00uaz3xmdoobfWWnY356' //console.log(values);

            };
            _context.next = 26;
            return Meterstanden.findOne({
              where: {
                datetime: rounded,
                user: '00uaz3xmdoobfWWnY356'
              }
            });

          case 26:
            gevondenmeterstand = _context.sent;

            if (!(gevondenmeterstand == null)) {
              _context.next = 33;
              break;
            }

            _context.next = 30;
            return Meterstanden.create(values);

          case 30:
            gevondenmeterstand = _context.sent;
            _context.next = 36;
            break;

          case 33:
            _context.next = 35;
            return gevondenmeterstand.update(values);

          case 35:
            gevondenmeterstand = _context.sent;

          case 36:
            _iteratorNormalCompletion = true;
            _context.next = 15;
            break;

          case 39:
            _context.next = 45;
            break;

          case 41:
            _context.prev = 41;
            _context.t0 = _context["catch"](13);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 45:
            _context.prev = 45;
            _context.prev = 46;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 48:
            _context.prev = 48;

            if (!_didIteratorError) {
              _context.next = 51;
              break;
            }

            throw _iteratorError;

          case 51:
            return _context.finish(48);

          case 52:
            return _context.finish(45);

          case 53:
            _context.next = 55;
            return Meterstanden.destroy({
              where: {
                datetime: _defineProperty({}, Op.lt, (0, _momentTimezone["default"])().subtract(3, 'days').startOf('day').toDate())
              }
            });

          case 55:
            return _context.abrupt("return");

          case 56:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[13, 41, 45, 53], [46,, 48, 52]]);
  }));

  return function updateMeterstanden() {
    return _ref.apply(this, arguments);
  };
}();

updateMeterstanden(false);