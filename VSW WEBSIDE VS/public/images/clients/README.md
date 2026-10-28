# Client logo assets

Put your approved client / partner logo files in this folder.

Only display logos you have permission to use. The 41 `.png` files in this folder
are the logos supplied for the published client board. They have white
backgrounds, so the "Light card" style is recommended for them.

Supported formats:
- SVG (recommended for crisp logos)
- PNG with a transparent background
- WEBP
- JPG (only if the logo has a solid background)

Recommended image setup:
- Keep each logo under 200 KB.
- Use a transparent background whenever possible.
- Do not stretch, crop, or recolour a logo.
- Use a file name that matches the company, for example `example-client.svg`.

Example paths you can enter in the admin panel:

```
/images/clients/example-client.svg
/images/clients/example-client.png
```

Files can also be uploaded from the admin panel. Uploaded logos are stored in
`02-BACKEND/uploads/clients/` and served automatically from `/uploads/clients/...`.

The `placeholder-*.svg` files are neutral development placeholders. They are not
another company's logo. Replace or delete them from the admin panel before publishing.
