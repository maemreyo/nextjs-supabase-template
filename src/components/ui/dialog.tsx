"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = "default",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  size?: "small" | "default" | "large" | "xlarge" | "xxlarge" | "xxxlarge" | "ultra" | "mega" | "ultra-wide" | "fullscreen"
}) {
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-[80vw] max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[75vh]";
      case "large":
        return "w-[90vw] max-w-[400px] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[85vh]";
      case "xlarge":
        return "w-[92vw] max-w-[450px] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[88vh]";
      case "xxlarge":
        return "w-[94vw] max-w-[500px] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[90vh]";
      case "xxxlarge":
        return "w-[95vw] max-w-[550px] sm:max-w-5xl md:max-w-6xl lg:max-w-7xl xl:max-w-[90vw] max-h-[92vh]";
      case "ultra":
        return "w-[96vw] max-w-[600px] sm:max-w-6xl md:max-w-7xl lg:max-w-[85vw] xl:max-w-[1800px] 2xl:max-w-[2000px] max-h-[94vh]";
      case "mega":
        return "w-[97vw] max-w-[650px] sm:max-w-7xl md:max-w-[85vw] lg:max-w-[90vw] xl:max-w-[2200px] 2xl:max-w-[2800px] max-h-[95vh]";
      case "ultra-wide":
        return "w-[98vw] max-w-[700px] sm:max-w-[85vw] md:max-w-[90vw] lg:max-w-[95vw] xl:max-w-[2800px] 2xl:max-w-[3400px] max-h-[96vh]";
      case "fullscreen":
        return "w-full h-full w-[100vw] max-h-[100vh] rounded-none m-0 top-0 left-0 translate-x-0 translate-y-0";
      default:
        return "w-[85vw] max-w-[350px] sm:max-w-lg md:max-w-xl max-h-[80vh]";
    }
  };

  const getPositionClasses = () => {
    if (size === "fullscreen") {
      return "top-0 left-0 translate-x-0 translate-y-0";
    }
    return "top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]";
  };

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay className={size === "fullscreen" ? "backdrop-blur-sm" : ""} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed z-50 grid gap-4 border shadow-lg duration-200",
          getSizeClasses(),
          getPositionClasses(),
          size !== "fullscreen" && "rounded-lg p-3 sm:p-4 md:p-5 lg:p-6",
          size === "fullscreen" && "p-0",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3 sm:[&_svg:not([class*='size-'])]:size-4",
              size === "fullscreen" ? "top-3 right-3 sm:top-4 sm:right-4" : "top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4"
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 sm:gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-1.5 sm:gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
