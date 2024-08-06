const connectDb = require("../../config/dbConfig");

module.exports = class SQLFunctions {
    static async insertQuery(params) {
      const db = await connectDb();
      try {
        const { tablename, columns, newValues } = params;
        const query = `INSERT INTO ${tablename} (${columns.join(', ')}) VALUES (${newValues.join(', ')})`;
        const request = db.request();
        await request.query(query);
        return { responseCode: 0 };
      } catch (error) {
        throw new Error(`Invalid INSERT: ${error.message}`);
      } finally {
        db.release();
      }
    }
  
    static async selectQuery(params) {
      const db = await connectDb();
      try {
        const { tablename, columns, condition } = params;
        const query = `SELECT ${columns.join(', ')} FROM ${tablename} WHERE ${condition}`;
        const result = await db.request().query(query);
        return { data: result.recordset[0] };
      } catch (error) {
        throw new Error(`Invalid SELECT: ${error.message}`);
      } finally {
        db.release();
      }
    }
  
    static async selectQueryMultiple(params) {
      const db = await connectDb();
      try {
        const { tablename, columns, condition, limit, offset, orderBy } = params;
        const query = `SELECT ${columns.join(', ')} FROM ${tablename} WHERE ${condition} order by ${orderBy} offset ${offset} rows fetch next ${limit} rows only`;
        const result = await db.request().query(query);
        return { data: result.recordset };
      } catch (error) {
        throw new Error(`Invalid SELECT: ${error.message}`);
      } finally {
        db.release();
      }
    }
  
    static async updateQuery(params) {
      const db = await connectDb();
      try {
        const { tablename, newValues, condition } = params;
        const query = `UPDATE ${tablename} SET ${newValues.join(', ')} WHERE ${condition}`;
        await db.request().query(query);
        return { responseCode: 0 };
      } catch (error) {
        throw new Error(`Invalid UPDATE: ${error.message}`);
      } finally {
        db.release();
      }
    }
  
    static async deleteQuery(params) {
      const db = await connectDb();
      try {
        const { tablename, condition } = params;
        const query = `DELETE FROM ${tablename} WHERE ${condition}`;
        await db.request().query(query);
        return { responseCode: 0 };
      } catch (error) {
        throw new Error(`Invalid DELETE: ${error.message}`);
      } finally {
        db.release();
      }
    }

    static selectLeftJoinSingle = async (params) => {
      let db = await connectDb();
      try {
        const query = await db
          .request()
          .query(`select ${params.join} where ${params.condition}`);
        return { responsecode: 0, data: query.recordset[0] };
      } catch (error) {
        const message = "Invalid JOIN QUERY";
        throw new Error(message);
      } finally {
        db.release();
      }
    };


  };
