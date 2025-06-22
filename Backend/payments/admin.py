from django.contrib import admin
from .models import  Payment, StripeCustomer, Subscription

admin.site.register(Payment)
admin.site.register(StripeCustomer)
admin.site.register(Subscription)  