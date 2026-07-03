"use client";

import { useState } from "react";
import { CalendarIcon, Download, FileQuestion, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SearchBar } from "@/components/ui/search-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "success",
] as const;
const BUTTON_SIZES = ["sm", "default", "lg"] as const;
const BADGE_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "success",
  "info",
  "warning",
  "destructive",
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-4 border-b py-10 first:pt-0">
      <h2 className="text-h3">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

/**
 * Referencia visual del Blueprint Component System (Prompt 5, Sprint 2).
 * No es una pantalla del producto: es documentacion viva para desarrollo,
 * analoga a un Storybook minimo. Verificar aqui variantes/tamanos/estados
 * antes de usarlos en pantallas reales.
 */
export default function ComponentsShowcasePage() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<Date | undefined>();

  return (
    <TooltipProvider>
      <div className="mx-auto flex max-w-4xl flex-col px-6 py-10">
        <h1 className="text-h1">Blueprint Component System</h1>
        <p className="text-body text-muted-foreground mt-2">
          Los 25 componentes oficiales (Prompt 5) sobre shadcn/ui + design tokens.
        </p>

        <Section id="button" title="1. Button">
          {BUTTON_SIZES.map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-2">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  {variant}
                </Button>
              ))}
              <Button size={size} disabled>
                Disabled
              </Button>
            </div>
          ))}
        </Section>

        <Section id="input" title="2. Input / Textarea">
          <div className="flex max-w-sm flex-col gap-2">
            <Label htmlFor="demo-input">Label</Label>
            <Input id="demo-input" placeholder="Placeholder" />
          </div>
          <div className="flex max-w-sm flex-col gap-2">
            <Label htmlFor="demo-textarea">Textarea</Label>
            <Textarea id="demo-textarea" placeholder="Escribe tu contenido aquí..." />
          </div>
        </Section>

        <Section id="select" title="3. Select / Dropdown / Date Picker">
          <div className="flex flex-wrap items-center gap-4">
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Opción A</SelectItem>
                <SelectItem value="b">Opción B</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Acciones</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Editar</DropdownMenuItem>
                <DropdownMenuItem>Duplicar</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon />
                  {date ? date.toLocaleDateString() : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
          </div>
        </Section>

        <Section id="checkbox" title="4. Checkbox / Radio / Toggle">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox id="demo-checkbox" defaultChecked />
              <Label htmlFor="demo-checkbox">Checkbox</Label>
            </div>
            <RadioGroup defaultValue="1" className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="1" id="r1" />
                <Label htmlFor="r1">Opción 1</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="2" id="r2" />
                <Label htmlFor="r2">Opción 2</Label>
              </div>
            </RadioGroup>
            <div className="flex items-center gap-2">
              <Switch id="demo-switch" defaultChecked />
              <Label htmlFor="demo-switch">Toggle</Label>
            </div>
          </div>
        </Section>

        <Section id="card" title="10. Card">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Plan de Marketing 2025</CardTitle>
              <CardDescription>Estrategia completa para posicionar la marca.</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={68} />
              <p className="text-small text-muted-foreground mt-2">68% completado</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Badge variant="success">Publicado</Badge>
              <Badge variant="outline">Marketing</Badge>
            </CardFooter>
          </Card>
        </Section>

        <Section id="tabs" title="11. Tabs / Accordion">
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="docs">Documentos</TabsTrigger>
              <TabsTrigger value="activity">Actividad</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="text-body text-muted-foreground pt-2">
              Contenido del tab activo.
            </TabsContent>
            <TabsContent value="docs" className="text-body text-muted-foreground pt-2">
              Documentos relacionados.
            </TabsContent>
            <TabsContent value="activity" className="text-body text-muted-foreground pt-2">
              Historial de actividad.
            </TabsContent>
          </Tabs>

          <Accordion type="single" collapsible className="max-w-lg">
            <AccordionItem value="a">
              <AccordionTrigger>¿Qué es un Blueprint?</AccordionTrigger>
              <AccordionContent>
                Es la representación estructurada de una metodología reutilizable.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>¿Cómo se crea?</AccordionTrigger>
              <AccordionContent>
                Desde el Blueprint Navigator, dentro de un Proyecto.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        <Section id="progress" title="13. Progress Bar / Badge">
          <Progress value={42} className="max-w-sm" />
          <div className="flex flex-wrap gap-2">
            {BADGE_VARIANTS.map((variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ))}
          </div>
        </Section>

        <Section id="tooltip" title="15. Tooltip / Toast">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Pasa el cursor aquí</Button>
              </TooltipTrigger>
              <TooltipContent>Tooltip informativo, sin ocupar espacio en pantalla.</TooltipContent>
            </Tooltip>

            <Button
              variant="outline"
              onClick={() =>
                toast.success("Documento guardado", {
                  description: "Tu documento se guardó correctamente.",
                })
              }
            >
              Disparar Toast
            </Button>
          </div>
        </Section>

        <Section id="dialog" title="17. Modal / Drawer">
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Eliminar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar acción</DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede
                    deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button variant="destructive">Eliminar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Ver detalles</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Detalles del Blueprint</SheetTitle>
                </SheetHeader>
                <p className="text-body text-muted-foreground px-4">
                  Panel lateral para contenido secundario (filtros, detalles, historial).
                </p>
              </SheetContent>
            </Sheet>
          </div>
        </Section>

        <Section id="table" title="19. Table / Breadcrumb">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Plan de Negocio</TableCell>
                <TableCell>
                  <Badge variant="success">Publicado</Badge>
                </TableCell>
                <TableCell>Hoy</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Proyección Financiera</TableCell>
                <TableCell>
                  <Badge variant="warning">Pendiente</Badge>
                </TableCell>
                <TableCell>Ayer</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Empresa</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Proyecto</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Workspace</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Section>

        <Section id="empty" title="21-23. Empty / Loading / Error State">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border">
              <EmptyState
                icon={FileQuestion}
                title="Aún no hay documentos"
                description="Crea tu primer documento para comenzar."
                actionLabel="Crear documento"
                onAction={() => toast("Crear documento")}
              />
            </div>
            <div className="flex flex-col gap-2 rounded-lg border p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="rounded-lg border">
              <ErrorState
                title="No se pudo cargar la información"
                cause="Error de conexión con el servidor."
                actionLabel="Reintentar"
                onAction={() => toast("Reintentando...")}
              />
            </div>
          </div>
        </Section>

        <Section id="search" title="24. Search Bar / Command Palette">
          <SearchBar
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar en el Blueprint..."
            className="max-w-sm"
          />

          <Command className="max-w-sm rounded-lg border">
            <CommandInput placeholder="Escribe un comando o busca..." />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup heading="Acciones rápidas">
                <CommandItem>
                  <Plus /> Nuevo Workspace
                </CommandItem>
                <CommandItem>
                  <Download /> Exportar documento
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </Section>

        <Separator />
        <p className="text-caption text-muted-foreground pt-6">
          docs/blueprint-master-spec.md §3 — Blueprint Card System
        </p>
      </div>
    </TooltipProvider>
  );
}
