"use strict";

require("@babel/polyfill");

var _sequelize = _interopRequireDefault(require("sequelize"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

console.log('abc123');

var db = require('../config/db.config.js');

var moment = require('moment-timezone');

var path = require("path");

var fetch = require("node-fetch");

var sequelize = new _sequelize["default"]('domoticzDB', null, null, {
  dialect: "sqlite",
  storage: '/home/pi/domoticz/domoticz.db'
});
var MultiMeter = sequelize.define('MultiMeter', {
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
      return moment.tz(moment(this.getDataValue('Date')).utc().format('YYYY-MM-DD HH:mm:ss'), 'Europe/Amsterdam');
    }
  }
}, {
  tableName: 'MultiMeter',
  timestamps: false
});
MultiMeter.removeAttribute('id');

exports.updateMeterstanden =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(req, res) {
    var meterstanden, lastentry, lastdate, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, stand, datum, coeff, date, rounded, values, gevondenmeterstand, allm;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return MultiMeter.findAll({
              where: {
                DeviceRowID: 3
              }
            });

          case 2:
            meterstanden = _context.sent;
            _context.next = 5;
            return MultiMeter.findOne({
              where: {
                //your where conditions, or without them if you need ANY entry
                user: '00uaz3xmdoobfWWnY356'
              },
              order: [['datetime', 'DESC']]
            });

          case 5:
            lastentry = _context.sent;
            lastdate = moment().add(-1, 'days');

            if (lastentry !== null) {
              console.log('Meterstanden moeten vanaf ' + moment(lastentry.datetime).format('YYYY-MM-DD HH:mm') + ' worden bijgewerkt');
              lastdate = lastentry.datetime;
            }

            if (req.params.force !== 'force') {
              meterstanden = meterstanden.filter(function (item) {
                return new Date(item.Date) >= new Date(lastdate);
              });
            } //console.log('test', meterstanden);


            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 12;
            _iterator = meterstanden[Symbol.iterator]();

          case 14:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 38;
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
            _context.next = 25;
            return MultiMeter.findOne({
              where: {
                datetime: rounded,
                user: '00uaz3xmdoobfWWnY356'
              }
            });

          case 25:
            gevondenmeterstand = _context.sent;

            if (!(gevondenmeterstand == null)) {
              _context.next = 32;
              break;
            }

            _context.next = 29;
            return MultiMeter.create(values);

          case 29:
            gevondenmeterstand = _context.sent;
            _context.next = 35;
            break;

          case 32:
            _context.next = 34;
            return gevondenmeterstand.update(values);

          case 34:
            gevondenmeterstand = _context.sent;

          case 35:
            _iteratorNormalCompletion = true;
            _context.next = 14;
            break;

          case 38:
            _context.next = 44;
            break;

          case 40:
            _context.prev = 40;
            _context.t0 = _context["catch"](12);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 44:
            _context.prev = 44;
            _context.prev = 45;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 47:
            _context.prev = 47;

            if (!_didIteratorError) {
              _context.next = 50;
              break;
            }

            throw _iteratorError;

          case 50:
            return _context.finish(47);

          case 51:
            return _context.finish(44);

          case 52:
            _context.next = 54;
            return MultiMeter.findAll({
              where: {
                datetime: {
                  $gte: moment().subtract(7, 'days').startOf('day').toDate()
                }
              }
            });

          case 54:
            allm = _context.sent;
            res.send(allm);

          case 56:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[12, 40, 44, 52], [45,, 47, 51]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();