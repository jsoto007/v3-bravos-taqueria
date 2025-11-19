"""admin dashboard enhancements

Revision ID: d8f2b1c3e4a5
Revises: 5e53f1afea55
Create Date: 2025-11-02 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd8f2b1c3e4a5'
down_revision = '5e53f1afea55'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.add_column(sa.Column('customer_name', sa.String(length=160), nullable=True))
        batch_op.add_column(sa.Column('customer_email', sa.String(length=254), nullable=True))
        batch_op.add_column(sa.Column('customer_phone', sa.String(length=40), nullable=True))
        batch_op.add_column(sa.Column('assigned_staff', sa.String(length=160), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.create_table(
        'admin_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=60), nullable=False),
        sa.Column('value', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key', name='uq_admin_settings_key')
    )


def downgrade():
    op.drop_table('admin_settings')
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('assigned_staff')
        batch_op.drop_column('customer_phone')
        batch_op.drop_column('customer_email')
        batch_op.drop_column('customer_name')
