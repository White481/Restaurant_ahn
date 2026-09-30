import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";

interface MenuItem extends RowDataPacket {
  menu_item_id: number;
  item_name: string;
  category: string | null;
  price: string;
}

export const menuRouter = Router();

menuRouter.get("/", async (req, res) => {
  const category = req.query.category;
  if (category !== undefined && typeof category !== "string") {
    res.status(400).json({ error: "category must be a single string" });
    return;
  }

  const trimmedCategory = category?.trim();
  const [items] = trimmedCategory
    ? await pool.execute<MenuItem[]>(
        `SELECT menu_item_id, item_name, category, price
         FROM menu_item
         WHERE category = ?
         ORDER BY category, item_name`,
        [trimmedCategory],
      )
    : await pool.query<MenuItem[]>(
        `SELECT menu_item_id, item_name, category, price
         FROM menu_item
         ORDER BY category, item_name`,
      );

  res.json({ data: items });
});
