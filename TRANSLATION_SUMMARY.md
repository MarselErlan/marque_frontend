# Translation Summary

## Hardcoded Strings Found That Need Translation:

### Profile Page (`app/profile/page.tsx`):

1. **Date labels**: "сегодня", "вчера" → `common.today`, `common.yesterday`
2. **Status labels**: "В ожидании", "Подтвержден", "Обрабатывается", "В пути", "Доставлен", "Отменен", "Возврат" → Already in `orders.status.*`
3. **Toast messages**: All validation and success/error messages → `validation.*` and `profile.*`
4. **UI labels**: "Личный кабинет", "Обновить", "ФИО", etc. → `profile.*`
5. **Address composition**: "ул.", "д.", "кв.", "подъезд", "этаж" → Used in `composeFullAddress` function
6. **Default values**: "Анна Ахматова", "Адрес" → `profile.defaultName`, `addresses.defaultTitle`

### Cart Page (`app/cart/page.tsx`):

1. **Item count**: "товар", "товара", "товаров" → `cart.items`, `cart.itemsPlural`, `cart.itemsMany`
2. **Empty cart**: "Ваша корзина пуста", "Добавьте товары..." → `cart.emptyCartMessage`, `cart.emptyCartDesc`
3. **Delivery date**: "Завтра", "Послезавтра" → `cart.tomorrow`, `cart.dayAfterTomorrow`
4. **Labels**: "Размер", "Цвет", "Дата доставки", etc. → `cart.*`

### Components:

1. **BottomNavigation**: "Профиль", "Войти" → Already translated
2. **CatalogSidebar**: "Товар, бренд или артикул" → `common.search`
3. **AuthModals**: Placeholder text → Already translated

### Status:

✅ Russian locale file updated with all new keys
⏳ English locale file needs updating
⏳ Kyrgyz locale file needs updating
⏳ Code needs to be updated to use `t()` function for all hardcoded strings
