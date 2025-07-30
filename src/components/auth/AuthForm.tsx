"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Chrome, Ghost } from "lucide-react";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: "login" | "signup";
}

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AuthForm({ mode }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const [isAnonymousLoading, setIsAnonymousLoading] = React.useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    if (!data.email || !data.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both email and password.",
      });
      return;
    }
    setIsLoading(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
      } else {
        await signInWithEmailAndPassword(auth, data.email, data.password);
      }
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google sign-in failed",
        description: error.message,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsAnonymousLoading(true);
    try {
      await signInAnonymously(auth);
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Anonymous sign-in failed",
        description: error.message,
      });
    } finally {
      setIsAnonymousLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    disabled={isLoading || isGoogleLoading || isAnonymousLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading || isGoogleLoading || isAnonymousLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isLoading || isGoogleLoading || isAnonymousLoading} type="submit" className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create Account" : "Log In"}
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={isLoading || isGoogleLoading || isAnonymousLoading} onClick={handleGoogleSignIn}>
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Chrome className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
      {mode === "login" && (
      <Button variant="outline" type="button" disabled={isLoading || isGoogleLoading || isAnonymousLoading} onClick={handleAnonymousSignIn}>
        {isAnonymousLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Ghost className="mr-2 h-4 w-4" />
        )}
        Guest
      </Button>
      )}
    </div>
  );
}
