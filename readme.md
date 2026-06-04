# Rules for Portfolio Website

---

### Main Content

1. `body_content`
2. `body_item_wrapper`
3. `body_item`

```
BODY ---------------------------------------->  .body_content
   ↪ ITEM WRAPPER -------------------------->   .body_item_wrapper
      ↪ ITEM HOLDER ------------------------>   .body_item
         ↪ ITEM or multiple ITEMS ---------->   (item class or id)
```
> Multiple `.body_item_wrapper` are allowed if you need to distinguish two types of content.

---