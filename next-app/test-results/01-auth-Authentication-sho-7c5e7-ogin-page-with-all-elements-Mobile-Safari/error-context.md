# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: Welcome back
      - generic [ref=e6]: Sign in to your Product Lifecycle Platform account
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Email
          - textbox "Email" [ref=e11]:
            - /placeholder: name@example.com
        - button "Send Magic Link" [ref=e12]
      - generic [ref=e17]: Or continue with
      - button "Sign in with Google" [ref=e18]:
        - img
        - text: Sign in with Google
    - generic [ref=e20]:
      - text: Don't have an account?
      - link "Sign up" [ref=e21]:
        - /url: /signup
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
    - generic [ref=e30]:
      - text: Compiling
      - generic [ref=e31]:
        - generic [ref=e32]: .
        - generic [ref=e33]: .
        - generic [ref=e34]: .
  - alert [ref=e35]
```