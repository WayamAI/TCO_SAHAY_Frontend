# shadcn/ui primitives

Only `button`, `input`, `label` and `sheet` are imported by the app today; the
rest are kept as an available surface.

**Icons:** this project uses Font Awesome exclusively, via
`@/components/icons/AppIcon` and the registry in
`@/components/icons/registry.ts`. `lucide-react` has been removed from the
dependency tree.

`components.json` still says `"iconLibrary": "lucide"` because shadcn has no
Font Awesome option. If you run `shadcn add`, the generated component will
import from `lucide-react` — replace those imports with `<AppIcon>` and add any
missing concept to the registry before committing.
