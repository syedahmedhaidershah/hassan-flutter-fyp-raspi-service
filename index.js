/**
 * This is a single page application specifically architected to be light weight and negate
 * maintainability to negligible and to be run on the raspi.
 */

/** Third party dependencies */
const {
    Sequelize,
    Model,
    DataTypes,
} = require('sequelize');

const express = require('express');

const _ = require('lodash');


const app = express();

const dbConfig = {
    mysql: {
        host: 'localhost',
        username: 'admin',
        password: 'password123',
        database: 'DCCDB',
    }
}

const applicationPort = 80;

const seedDB = false;

const {
    mysql: { host, username, password, database },
} = dbConfig;


const sequelize = new Sequelize(
    database,
    username,
    password,
    {
        host,
        dialect: 'mysql'
    }
);


app.use(cors());


const appRouter = express.Router();


const SensorData = sequelize.define(
    'sensors_data',
    {
        id: {
            type: DataTypes.INTEGER(11).UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        Date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        Time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        Current: {
            type: DataTypes.FLOAT(10, 5),
        },
        Voltage: {
            type: DataTypes.FLOAT(10, 5),
        },
        Power: {
            type: DataTypes.FLOAT(10, 5),
        }, Í
    },
    {
        timestamps: false,
        paranoid: true,
    }
);

const staticMethods = {
    pushSensorData: async (data) => {
        try {
            const newSensorData = new SensorData({ ...data }, {});
            newSensorData.isNewRecord = true;
            const saved = await newSensorData.save();
            return saved;
        } catch (exc) {
            throw exc;
        }
    },
    getSensorData: async (data) => {
        try {
            const found = await SensorData.findOne({
                where: {
                    ...data,
                }
            }, {});
            return found;
        } catch (exc) {
            throw exc;
        }
    },
    getSensorDataByPlayerId: async (player_id) => {
        try {
            const found = await SensorData.findOne({
                where: {
                    player_id,
                }
            }, {});

            return found;
        } catch (exc) {
            throw exc;
        }
    },
    /**
     * Method to fetch multiple instances of the schema
     * @param {Object} data Data to query against 
     * @param {Object} options Query options 
     * @param {Number} options.skip Skip for pagination 
     * @param {Number} options.limit Limit for pagination
     * @param {Boolean} options.forceJSON Map documents to JSON
     * @returns 
     */
    fetchMultiple: async (data = {}, options = {}) => {
        try {
            let {
                skip = 0,
                limit = 10,
                forceJSON = false
            } = options;

            const offset = (limit === Infinity) ? +skip : +skip * +limit;

            const queryObject = {
                where: {
                    ...data,
                },
                offset,
            }

            if (limit !== Infinity)
                Object.assign(queryObject, { limit: +limit });

            const found = await SensorData.findAll(queryObject);

            if (forceJSON)
                return found.map(found => found.toJSON());

            return found;
        } catch (exc) {
            throw exc;
        }
    }
}

const classMethods = {
    safeModel: function (attributesToOmit = []) {
        const json = (
            this?.toJSON() || null
        );

        return _.omit(
            json,
            [
                'created_at',
                'updated_at',
                ...attributesToOmit,
            ]);
    }
};


Object.assign(
    SensorData,
    staticMethods,
)

Object.assign(
    SensorData.prototype,
    classMethods,
)


app.use('/', appRouter);


const getSensorData = async (req, res, next) => {
    try {
        const { query } = req;

        const sensorData = await SensorData
            .getSensorData(query);

        return sensorData;
    } catch (exc) {
        res
            .status(500)
            .send({ message: 'error' });
    }
}


const getSensorDataMultiple = async (req, res, next) => {
    try {
        const { query } = req;

        const sensorsData = await SensorData
            .fetchMultiple(
                query,
                { forceJSON: true }
            );

        return sensorsData;
    } catch (exc) {
        res
            .status(500)
            .send({ message: 'error' });
    }
}


const pushSensorData = async (req, res, next) => {
    try {
        const { body } = req;

        const sensorsData = await SensorData
            .create(body)

        return sensorsData;
    } catch (exc) {
        res
            .status(500)
            .send({ message: 'error' });
    }
}


const updateSensorData = async (req, res, next) => {
    try {
        const {
            body: {
                data,
                query
            }
        } = req;

        const sensorsDataUpdated = await SensorData
            .update(
                {
                    ...data
                },
                {
                    where: {
                        ...query
                    },
                    transaction,
                });

        return sensorsDataUpdated;
    } catch (exc) {
        res
            .status(500)
            .send({ message: 'error' });
    }
}


appRouter
    .get(
        '/',
        getSensorData,
    )
    .get(
        '/list',
        getSensorDataMultiple,
    )
    .post(
        '/',
        pushSensorData,
    )
    .patch(
        '/',
        updateSensorData,
    );

appRouter
    .all(
        '*',
        (req, res, next) => res
            .status(404)
            .send('notfound')
    )


app.listen(
    applicationPort,
    console.log
        .bind(
            null,
            `application is live on `
        )
);