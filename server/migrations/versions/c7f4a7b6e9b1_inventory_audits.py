"""
Add inventory audit session tables

Revision ID: c7f4a7b6e9b1
Revises: d8f2b1c3e4a5
Create Date: 2025-11-03 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c7f4a7b6e9b1'
down_revision = 'd8f2b1c3e4a5'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'inventory_audit_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('note', sa.String(length=1000), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table(
        'inventory_audit_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('inventory_item_id', sa.Integer(), nullable=False),
        sa.Column('previous_qty', sa.Float(), nullable=False),
        sa.Column('new_qty', sa.Float(), nullable=False),
        sa.Column('expiration_date', sa.Date(), nullable=True),
        sa.Column('note', sa.String(length=1000), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id']),
        sa.ForeignKeyConstraint(['session_id'], ['inventory_audit_sessions.id']),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('inventory_audit_items', schema=None) as batch_op:
        batch_op.create_index('ix_inventory_audit_items_session_id', ['session_id'], unique=False)


def downgrade():
    with op.batch_alter_table('inventory_audit_items', schema=None) as batch_op:
        batch_op.drop_index('ix_inventory_audit_items_session_id')
    op.drop_table('inventory_audit_items')
    op.drop_table('inventory_audit_sessions')
