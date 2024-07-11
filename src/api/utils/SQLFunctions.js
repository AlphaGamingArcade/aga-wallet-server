const connectDb = require("../../config/dbConfig");

module.exports = class SQLFunctions {
    static async insertQuery(params) {
      const db = await connectDb();
      try {
        const { tablename, columns, newValues } = params;
        const query = `INSERT INTO ${tablename} (${columns.join(', ')}) VALUES (${newValues.join(', ')})`;
        const request = db.request();
        columns.forEach((col, i) => request.input(col, newValues[i]));
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
        const { tablename, columns, condition } = params;
        const query = `SELECT ${columns.join(', ')} FROM ${tablename} WHERE ${condition}`;
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
  };
