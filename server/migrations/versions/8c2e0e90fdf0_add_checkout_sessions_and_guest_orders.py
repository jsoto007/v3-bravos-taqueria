"""add checkout sessions table and guest session tracking

Revision ID: 8c2e0e90fdf0
Revises: 5e53f1afea55
Create Date: 2025-02-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '8c2e0e90fdf0'
down_revision = '5e53f1afea55'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('orders', sa.Column('guest_session_id', sa.String(length=64), nullable=True))
    op.create_index(op.f('ix_orders_guest_session_id'), 'orders', ['guest_session_id'], unique=False)

    op.create_table(
        'checkout_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cart_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('guest_session_id', sa.String(length=64), nullable=True),
        sa.Column('stripe_session_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_client_secret', sa.String(length=255), nullable=True),
        sa.Column('amount_total', sa.Numeric(10, 2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='USD'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='pending'),
        sa.Column('tip_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('cart_snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('order_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['cart_id'], ['carts.id'], ),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_checkout_sessions_guest_session_id'), 'checkout_sessions', ['guest_session_id'], unique=False)
    op.create_index(op.f('ix_checkout_sessions_status'), 'checkout_sessions', ['status'], unique=False)
    op.create_index(op.f('ix_checkout_sessions_stripe_session_id'), 'checkout_sessions', ['stripe_session_id'], unique=True)
    op.create_index(op.f('ix_checkout_sessions_user_id'), 'checkout_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_checkout_sessions_order_id'), 'checkout_sessions', ['order_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_checkout_sessions_order_id'), table_name='checkout_sessions')
    op.drop_index(op.f('ix_checkout_sessions_user_id'), table_name='checkout_sessions')
    op.drop_index(op.f('ix_checkout_sessions_stripe_session_id'), table_name='checkout_sessions')
    op.drop_index(op.f('ix_checkout_sessions_status'), table_name='checkout_sessions')
    op.drop_index(op.f('ix_checkout_sessions_guest_session_id'), table_name='checkout_sessions')
    op.drop_table('checkout_sessions')

    op.drop_index(op.f('ix_orders_guest_session_id'), table_name='orders')
    op.drop_column('orders', 'guest_session_id')
