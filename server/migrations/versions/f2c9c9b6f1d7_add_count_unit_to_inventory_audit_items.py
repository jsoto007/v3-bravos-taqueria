"""add count unit to inventory audit items

Revision ID: f2c9c9b6f1d7
Revises: c7f4a7b6e9b1
Create Date: 2024-05-27 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f2c9c9b6f1d7'
down_revision = 'c7f4a7b6e9b1'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('inventory_audit_items', schema=None) as batch_op:
        batch_op.add_column(sa.Column('count_unit_code', sa.String(length=16), nullable=True))


def downgrade():
    with op.batch_alter_table('inventory_audit_items', schema=None) as batch_op:
        batch_op.drop_column('count_unit_code')

