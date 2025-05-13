
Relationships Explained:
User → CarInventory: A single user can create many car inventory entries (1 → Many).
User → CarEditLog: A user (as an editor) can make many edits across car inventory entries (1 → Many).
CarInventory → User: Each car inventory item is associated with exactly one user (Many ← 1).
CarInventory → CarPhoto: Each car inventory entry can have multiple associated photos (1 → Many).
CarInventory → CarEditLog: Each car inventory entry can have many edit logs (1 → Many).
CarEditLog → User: Each edit log is linked to one user (the editor) (Many ← 1).
CarPhoto → CarInventory: Each photo belongs to exactly one car inventory entry (Many ← 1).
MasterCarRecord: It stands alone without foreign keys or relationships to other tables. Used only by admins for reference.



🔵 User
	•	Attributes: id, email, _password_hash, admin, created_at, updated_at
	•	Relationships:
	•	1-to-Many → CarInventory: One user can create many car inventory entries.
	•	1-to-Many → CarEditLog: One user (as an editor) can make many edits across cars.

⸻

🟢 CarInventory
	•	Attributes: id, location, vin_number, is_submitted, is_reviewed, purchase_price, sold_price, year, make, is_sold, user_id, created_at, updated_at
	•	Relationships:
	•	Many-to-1 ← User: Each inventory item belongs to one user.
	•	1-to-Many → CarPhoto: Each inventory item can have multiple associated photos.
	•	1-to-Many → CarEditLog: Each inventory item can have multiple logs of edits made to it.

⸻

🟣 CarPhoto
	•	Attributes: id, url, car_inventory_id
	•	Relationships:
	•	Many-to-1 ← CarInventory: Each photo belongs to a single car inventory entry.

⸻

🟠 CarEditLog
	•	Attributes: id, car_inventory_id, field_changed, old_value, new_value, edited_by, edited_at
	•	Relationships:
	•	Many-to-1 ← CarInventory: Each edit log is linked to one car inventory entry.
	•	Many-to-1 ← User (as editor): Each edit log records which user made the change.

⸻

🔴 MasterCarRecord
	•	Attributes: id, vin_number, location, year, make, purchase_price, is_sold, created_at, updated_at
	•	Relationships:
	•	No direct foreign keys.
	•	This is a stand-alone reference table used only by admins to verify submissions.